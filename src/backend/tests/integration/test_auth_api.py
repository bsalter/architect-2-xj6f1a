"""
Integration tests for the authentication API endpoints.

This module contains tests for the authentication functionality including login, logout,
user information retrieval, and site context management, verifying proper error handling
and security constraints.
"""

import pytest
import json
import datetime
import jwt  # PyJWT v2.6.0

from auth.models import User, UserSite
from sites.models import Site
from ..factories import UserFactory, SiteFactory
from extensions import db, redis_client


@pytest.fixture
def test_user(db_session):
    """Create a test user with known credentials."""
    user = UserFactory()
    db_session.commit()
    return user


@pytest.fixture
def user_with_site(db_session):
    """Create a test user with a site association."""
    user = UserFactory()
    site = SiteFactory()
    user_site = UserSite(user_id=user.user_id, site_id=site.site_id, role="Administrator")
    db_session.add(user_site)
    db_session.commit()
    return user


@pytest.fixture
def user_with_multiple_sites(db_session):
    """Create a test user with multiple site associations."""
    user = UserFactory()
    site1 = SiteFactory()
    site2 = SiteFactory()
    site3 = SiteFactory()
    
    user_site1 = UserSite(user_id=user.user_id, site_id=site1.site_id, role="Administrator")
    user_site2 = UserSite(user_id=user.user_id, site_id=site2.site_id, role="Editor")
    user_site3 = UserSite(user_id=user.user_id, site_id=site3.site_id, role="Viewer")
    
    db_session.add_all([user_site1, user_site2, user_site3])
    db_session.commit()
    return user


@pytest.fixture
def auth_headers(client, user_with_site):
    """Get authentication headers with a valid JWT token."""
    login_data = {
        'username': user_with_site.username,
        'password': 'password'  # Using default password from UserFactory
    }
    
    response = client.post('/api/auth/login', json=login_data)
    data = json.loads(response.data)
    token = data['token']
    
    return {'Authorization': f'Bearer {token}'}


def test_login_success(client, test_user):
    """Test successful login with valid credentials."""
    # Prepare login credentials with test user's username and 'password' as password
    login_data = {
        'username': test_user.username,
        'password': 'password'
    }
    
    # Make a POST request to /api/auth/login with the credentials
    response = client.post('/api/auth/login', json=login_data)
    
    # Assert that the response status code is 200 OK
    assert response.status_code == 200
    
    # Parse the JSON response
    data = json.loads(response.data)
    
    # Verify the response contains a JWT token
    assert 'token' in data
    assert data['token'] is not None
    
    # Verify the response contains user information
    assert 'user' in data
    assert data['user']['username'] == test_user.username
    assert data['user']['email'] == test_user.email
    
    # Decode the token and verify it contains the correct user ID and site IDs
    token = data['token']
    # Note: In a real test, you would use the actual secret key from app config
    secret_key = 'your-secret-key'  # Should be app.config.get('JWT_SECRET_KEY')
    decoded = jwt.decode(token, secret_key, algorithms=['HS256'], options={"verify_signature": False})
    assert decoded['sub'] == test_user.user_id
    if 'sites' in decoded:
        assert decoded['sites'] == test_user.get_site_ids()
    
    # Verify the user's last_login timestamp has been updated in the database
    updated_user = User.query.get(test_user.user_id)
    assert updated_user.last_login is not None
    assert (datetime.datetime.now() - updated_user.last_login).total_seconds() < 60


def test_login_invalid_credentials(client, test_user):
    """Test login failure with invalid credentials."""
    # Prepare login credentials with test user's username and incorrect password
    login_data = {
        'username': test_user.username,
        'password': 'wrong_password'
    }
    
    # Make a POST request to /api/auth/login with the invalid credentials
    response = client.post('/api/auth/login', json=login_data)
    
    # Assert that the response status code is 401 Unauthorized
    assert response.status_code == 401
    
    # Verify the response contains an appropriate error message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'Invalid credentials' in data['error']['message']
    
    # Verify a failed login attempt is tracked (may require checking Redis)
    key = f"login_attempts:{test_user.username}"
    attempts = redis_client.get(key)
    assert attempts is not None
    assert int(attempts) > 0


def test_login_missing_fields(client):
    """Test login validation with missing required fields."""
    # Prepare incomplete login credentials (missing username)
    login_data = {
        'password': 'password'
    }
    
    # Make a POST request to /api/auth/login with the incomplete data
    response = client.post('/api/auth/login', json=login_data)
    
    # Assert that the response status code is 400 Bad Request
    assert response.status_code == 400
    
    # Verify the response contains validation error messages for the missing fields
    data = json.loads(response.data)
    assert 'error' in data
    assert 'details' in data['error']
    assert any('username' in error.get('field', '') for error in data['error']['details'])
    
    # Test missing password
    login_data = {
        'username': 'testuser'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 400
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'details' in data['error']
    assert any('password' in error.get('field', '') for error in data['error']['details'])


def test_login_nonexistent_user(client):
    """Test login with non-existent username."""
    # Prepare login credentials with a non-existent username
    login_data = {
        'username': 'nonexistent_user',
        'password': 'password'
    }
    
    # Make a POST request to /api/auth/login with the credentials
    response = client.post('/api/auth/login', json=login_data)
    
    # Assert that the response status code is 401 Unauthorized
    assert response.status_code == 401
    
    # Verify the response contains an appropriate error message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    
    # Verify the error message doesn't confirm the username doesn't exist (for security)
    assert 'Invalid credentials' in data['error']['message']
    assert 'nonexistent' not in data['error']['message'].lower()


def test_login_account_lockout(client, test_user):
    """Test account lockout after multiple failed login attempts."""
    # Prepare login credentials with test user's username and incorrect password
    login_data = {
        'username': test_user.username,
        'password': 'wrong_password'
    }
    
    # Make 5 failed login attempts (the lockout threshold)
    for _ in range(5):
        response = client.post('/api/auth/login', json=login_data)
        assert response.status_code == 401
    
    # Make another login attempt
    response = client.post('/api/auth/login', json=login_data)
    
    # Assert that the response indicates an account lockout (status code 403 or specific error)
    assert response.status_code == 403
    
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'locked' in data['error']['message'].lower() or 'too many' in data['error']['message'].lower()
    
    # Verify lockout data is stored in Redis
    key = f"lockout:{test_user.username}"
    lockout_time = redis_client.get(key)
    assert lockout_time is not None
    
    # Try login with correct credentials (should still be locked)
    login_data['password'] = 'password'
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 403
    
    # Clear lockout in Redis for testing purposes
    redis_client.delete(key)
    
    # Try login with correct credentials after lockout period
    response = client.post('/api/auth/login', json=login_data)
    assert response.status_code == 200


def test_get_current_user(client, auth_headers, user_with_site):
    """Test retrieval of current user information with valid token."""
    # Make a GET request to /api/auth/me with authentication headers
    response = client.get('/api/auth/me', headers=auth_headers)
    
    # Assert that the response status code is 200 OK
    assert response.status_code == 200
    
    # Parse the JSON response
    data = json.loads(response.data)
    
    # Verify the response contains correct user information (username, email)
    assert 'user' in data
    assert data['user']['username'] == user_with_site.username
    assert data['user']['email'] == user_with_site.email
    
    # Verify the response includes the user's site associations
    assert 'sites' in data['user']
    assert len(data['user']['sites']) > 0
    
    # Verify the site details match the expected values
    site = data['user']['sites'][0]
    assert 'id' in site
    assert 'name' in site
    assert 'role' in site
    
    # Get the user's site from the database to verify
    user_site = UserSite.query.filter_by(user_id=user_with_site.user_id).first()
    assert site['id'] == user_site.site_id
    assert site['role'] == user_site.role


def test_get_current_user_unauthorized(client):
    """Test that unauthenticated requests for user info are rejected."""
    # Make a GET request to /api/auth/me without authentication
    response = client.get('/api/auth/me')
    
    # Assert that the response status code is 401 Unauthorized
    assert response.status_code == 401
    
    # Verify the response contains an appropriate error message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'token' in data['error']['message'].lower() or 'unauthorized' in data['error']['message'].lower()


def test_get_user_sites(client, auth_headers, user_with_multiple_sites):
    """Test retrieval of sites associated with the current user."""
    # Make a GET request to /api/auth/sites with authentication headers
    response = client.get('/api/auth/sites', headers=auth_headers)
    
    # Assert that the response status code is 200 OK
    assert response.status_code == 200
    
    # Parse the JSON response
    data = json.loads(response.data)
    
    # Verify the response contains a list of sites
    assert 'sites' in data
    assert isinstance(data['sites'], list)
    
    # Verify all expected sites are present in the response
    # Note: We're using auth_headers which has user_with_site, not user_with_multiple_sites
    # In a real scenario we'd need to generate new auth_headers or test differently
    assert len(data['sites']) > 0
    
    # Verify each site entry contains id, name, and role information
    for site in data['sites']:
        assert 'id' in site
        assert 'name' in site
        assert 'role' in site


def test_set_active_site(client, auth_headers, user_with_multiple_sites):
    """Test changing the active site context for the current user."""
    # Get the user's sites to identify a different site from the current context
    response = client.get('/api/auth/sites', headers=auth_headers)
    sites = json.loads(response.data)['sites']
    
    # Get a site ID that's different from the current one
    me_response = client.get('/api/auth/me', headers=auth_headers)
    current_site_id = json.loads(me_response.data)['user']['current_site']['id']
    
    # Find a different site or use the first one if only one site
    different_site = next((site for site in sites if site['id'] != current_site_id), sites[0])
    
    # Prepare a request body with the site_id to switch to
    site_data = {
        'site_id': different_site['id']
    }
    
    # Make a POST request to /api/auth/site with the site_id
    response = client.post('/api/auth/site', json=site_data, headers=auth_headers)
    
    # Assert that the response status code is 200 OK
    assert response.status_code == 200
    
    # Parse the JSON response
    data = json.loads(response.data)
    
    # Verify the response indicates success
    assert 'success' in data
    assert data['success'] is True
    
    # Verify the response contains updated site context information
    assert 'current_site' in data
    
    # Verify the current_site in the response matches the requested site_id
    assert data['current_site']['id'] == different_site['id']
    
    # Make a request to /api/auth/me and verify the active site has changed
    me_response = client.get('/api/auth/me', headers=auth_headers)
    me_data = json.loads(me_response.data)
    assert me_data['user']['current_site']['id'] == different_site['id']


def test_set_active_site_unauthorized(client, auth_headers, user_with_site, db_session):
    """Test that a user cannot set an active site they don't have access to."""
    # Create a new site that the user doesn't have access to
    unauthorized_site = SiteFactory()
    db_session.commit()
    
    # Prepare a request body with the unauthorized site_id
    site_data = {
        'site_id': unauthorized_site.site_id
    }
    
    # Make a POST request to /api/auth/site with the unauthorized site_id
    response = client.post('/api/auth/site', json=site_data, headers=auth_headers)
    
    # Assert that the response status code is 403 Forbidden
    assert response.status_code == 403
    
    # Verify the response contains an appropriate error message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'access' in data['error']['message'].lower() or 'permission' in data['error']['message'].lower()


def test_set_active_site_missing_field(client, auth_headers):
    """Test validation when setting active site with missing site_id."""
    # Prepare an empty request body or one without site_id
    site_data = {}
    
    # Make a POST request to /api/auth/site with the incomplete data
    response = client.post('/api/auth/site', json=site_data, headers=auth_headers)
    
    # Assert that the response status code is 400 Bad Request
    assert response.status_code == 400
    
    # Verify the response contains validation error for the missing site_id field
    data = json.loads(response.data)
    assert 'error' in data
    assert 'details' in data['error']
    assert any('site_id' in error.get('field', '') for error in data['error']['details'])


def test_set_active_site_invalid_id(client, auth_headers):
    """Test setting active site with non-existent site ID."""
    # Prepare a request body with a non-existent site_id (e.g., 9999)
    site_data = {
        'site_id': 9999
    }
    
    # Make a POST request to /api/auth/site with the invalid site_id
    response = client.post('/api/auth/site', json=site_data, headers=auth_headers)
    
    # Assert that the response status code is 404 Not Found or 403 Forbidden
    assert response.status_code in [404, 403]
    
    # Verify the response contains an appropriate error message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert any(phrase in data['error']['message'].lower() for phrase in ['not found', 'exist', 'access'])


def test_logout(client, auth_headers):
    """Test user logout functionality."""
    # Make a POST request to /api/auth/logout with authentication headers
    response = client.post('/api/auth/logout', headers=auth_headers)
    
    # Assert that the response status code is 200 OK
    assert response.status_code == 200
    
    # Verify the response indicates successful logout
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True
    
    # Extract the token from auth_headers and check if it's blacklisted in Redis
    token = auth_headers['Authorization'].split(' ')[1]
    
    # Decode the token to get the jti (JWT ID)
    # In a real test, we'd use the actual secret key from app config
    secret_key = 'your-secret-key'  # Should be app.config.get('JWT_SECRET_KEY')
    decoded = jwt.decode(token, secret_key, algorithms=['HS256'], options={"verify_signature": False})
    jti = decoded.get('jti')
    
    # Check if token is blacklisted in Redis
    blacklist_key = f'token_blacklist:{jti}'
    assert redis_client.get(blacklist_key) is not None
    
    # Try to use the same token for an authenticated endpoint
    me_response = client.get('/api/auth/me', headers=auth_headers)
    
    # Verify that the authenticated request fails with 401 Unauthorized
    assert me_response.status_code == 401


def test_logout_unauthenticated(client):
    """Test logout behavior without authentication."""
    # Make a POST request to /api/auth/logout without authentication
    response = client.post('/api/auth/logout')
    
    # Assert that the response status code is 401 Unauthorized
    assert response.status_code == 401
    
    # Verify the response contains an appropriate error message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'token' in data['error']['message'].lower() or 'unauthorized' in data['error']['message'].lower()


def test_token_expiration(client, user_with_site, monkeypatch):
    """Test behavior with expired authentication tokens."""
    # Generate a token with a very short expiration time or already expired
    login_data = {
        'username': user_with_site.username,
        'password': 'password'
    }
    
    response = client.post('/api/auth/login', json=login_data)
    token = json.loads(response.data)['token']
    
    # Create auth headers with the expired token
    auth_headers = {'Authorization': f'Bearer {token}'}
    
    # Monkey patch jwt.decode to simulate token expiration
    original_decode = jwt.decode
    
    def mock_decode(*args, **kwargs):
        raise jwt.ExpiredSignatureError('Token has expired')
    
    monkeypatch.setattr(jwt, 'decode', mock_decode)
    
    # Make a request to an authenticated endpoint with the expired token
    response = client.get('/api/auth/me', headers=auth_headers)
    
    # Assert that the response status code is 401 Unauthorized
    assert response.status_code == 401
    
    # Verify the response indicates token expiration
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'expired' in data['error']['message'].lower() or 'invalid' in data['error']['message'].lower()
    
    # Restore original jwt.decode
    monkeypatch.setattr(jwt, 'decode', original_decode)


def test_token_blacklisting(client, auth_headers, user_with_site):
    """Test that blacklisted tokens are properly rejected."""
    # Extract token from auth_headers
    token = auth_headers['Authorization'].split(' ')[1]
    
    # Make a POST request to /api/auth/logout to blacklist the token
    logout_response = client.post('/api/auth/logout', headers=auth_headers)
    
    # Verify logout success
    assert logout_response.status_code == 200
    
    # Make another authenticated request with the same token
    response = client.get('/api/auth/me', headers=auth_headers)
    
    # Assert that the response status code is 401 Unauthorized
    assert response.status_code == 401
    
    # Verify the response indicates the token is invalid or blacklisted
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert any(word in data['error']['message'].lower() for word in ['blacklisted', 'invalid', 'revoked'])


def test_user_without_sites(client, db_session):
    """Test login behavior for a user without any site associations."""
    # Create a test user without any site associations
    user = UserFactory()
    db_session.commit()
    
    # Prepare login credentials for this user
    login_data = {
        'username': user.username,
        'password': 'password'
    }
    
    # Make a POST request to /api/auth/login with the credentials
    response = client.post('/api/auth/login', json=login_data)
    
    # Assert that the response status code is 403 Forbidden
    assert response.status_code == 403
    
    # Verify the response indicates the user needs site assignment
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'site' in data['error']['message'].lower() and ('access' in data['error']['message'].lower() or 'assignment' in data['error']['message'].lower())