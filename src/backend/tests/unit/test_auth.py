"""
Unit tests for authentication functionality including JWT token handling, 
user authentication, and site-scoped access control
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, Mock

from auth.services import authenticate_user, generate_token, validate_token, get_user_sites
from auth.utils import hash_password, verify_password
from auth.middlewares import SiteContextFilter, jwt_required
from tests.factories import UserFactory, SiteFactory, UserSiteFactory


@pytest.mark.unit
def test_authenticate_user_success():
    """Tests successful user authentication with valid credentials"""
    # Create test user with known credentials
    test_user = UserFactory.build(username="testuser")
    test_password = "password123"
    test_user.password_hash = hash_password(test_password)
    
    # Mock the database query to return the test user
    with patch('auth.services.User.query') as mock_query:
        mock_query.filter_by.return_value.first.return_value = test_user
        
        # Call authenticate_user with valid username and password
        result = authenticate_user("testuser", test_password)
        
        # Assert that authentication succeeds
        assert result is not None
        assert result.username == test_user.username


@pytest.mark.unit
def test_authenticate_user_invalid_credentials():
    """Tests user authentication with invalid credentials"""
    # Create test user with known credentials
    test_user = UserFactory.build(username="testuser")
    test_user.password_hash = hash_password("password123")
    
    # Mock the database query to return the test user
    with patch('auth.services.User.query') as mock_query:
        mock_query.filter_by.return_value.first.return_value = test_user
        
        # Call authenticate_user with invalid password
        with pytest.raises(Exception) as excinfo:
            authenticate_user("testuser", "wrongpassword")
            
        # Assert that authentication fails with the expected error
        assert "Invalid username or password" in str(excinfo.value)


@pytest.mark.unit
def test_authenticate_user_nonexistent():
    """Tests authentication attempt with non-existent user"""
    # Mock the database query to return None (user not found)
    with patch('auth.services.User.query') as mock_query:
        mock_query.filter_by.return_value.first.return_value = None
        
        # Call authenticate_user with any username and password
        with pytest.raises(Exception) as excinfo:
            authenticate_user("nonexistentuser", "anypassword")
            
        # Assert that authentication fails with the expected error
        assert "Invalid username or password" in str(excinfo.value)


@pytest.mark.unit
def test_generate_token():
    """Tests JWT token generation with user and site information"""
    # Create test user with site associations
    test_user = UserFactory.build(id=1, username="testuser")
    test_site1 = SiteFactory.build(site_id=1, name="Site 1")
    test_site2 = SiteFactory.build(site_id=2, name="Site 2")
    
    # Mock get_site_ids method to return site IDs
    test_user.get_site_ids = Mock(return_value=[1, 2])
    
    # Call generate_token with the user data
    token = generate_token({"sub": test_user.id, "sites": test_user.get_site_ids()}, "test_secret")
    
    # Decode the token and verify its contents
    decoded_token = validate_token(token, "test_secret")
    
    # Verify that the token includes user ID, site IDs, and appropriate expiration
    assert decoded_token is not None
    assert decoded_token["sub"] == test_user.id
    assert decoded_token["sites"] == [1, 2]
    assert "exp" in decoded_token
    assert "iat" in decoded_token


@pytest.mark.unit
def test_validate_token_valid():
    """Tests validation of valid JWT tokens"""
    # Create a valid token with known payload
    payload = {"sub": 1, "sites": [1, 2]}
    token = generate_token(payload, "test_secret")
    
    # Call validate_token with the token
    result = validate_token(token, "test_secret")
    
    # Assert that validation succeeds and returns the expected payload
    assert result is not None
    assert result["sub"] == payload["sub"]
    assert result["sites"] == payload["sites"]


@pytest.mark.unit
def test_validate_token_expired():
    """Tests validation of expired JWT tokens"""
    # Create an expired token
    payload = {
        "sub": 1, 
        "sites": [1, 2],
        "exp": datetime.utcnow() - timedelta(hours=1)  # Expired 1 hour ago
    }
    token = generate_token(payload, "test_secret")
    
    # Call validate_token with the token
    result = validate_token(token, "test_secret")
    
    # Assert that validation fails with the expected error
    assert result is None


@pytest.mark.unit
def test_validate_token_invalid_signature():
    """Tests validation of JWT tokens with invalid signature"""
    # Create a token with known payload
    payload = {"sub": 1, "sites": [1, 2]}
    token = generate_token(payload, "correct_secret")
    
    # Call validate_token with the token but a different secret
    result = validate_token(token, "wrong_secret")
    
    # Assert that validation fails with the expected error
    assert result is None


@pytest.mark.unit
def test_hash_password():
    """Tests password hashing functionality"""
    # Define a test password
    test_password = "SecurePassword123!"
    
    # Call hash_password function
    hashed = hash_password(test_password)
    
    # Assert that the result is not the original password
    assert hashed != test_password
    
    # Assert that the hash has the expected format
    assert hashed.startswith("$2b$")


@pytest.mark.unit
def test_verify_password_valid():
    """Tests password verification with valid password"""
    # Define a test password
    test_password = "SecurePassword123!"
    
    # Generate a hash of the password
    hashed = hash_password(test_password)
    
    # Call verify_password with the correct password and hash
    result = verify_password(test_password, hashed)
    
    # Assert that verification succeeds
    assert result is True


@pytest.mark.unit
def test_verify_password_invalid():
    """Tests password verification with invalid password"""
    # Define a test password
    test_password = "SecurePassword123!"
    wrong_password = "WrongPassword456!"
    
    # Generate a hash of the password
    hashed = hash_password(test_password)
    
    # Call verify_password with an incorrect password and the hash
    result = verify_password(wrong_password, hashed)
    
    # Assert that verification fails
    assert result is False


@pytest.mark.unit
def test_get_user_sites():
    """Tests retrieving sites associated with a user"""
    # Create test user and site associations
    test_user = UserFactory.build(id=1)
    test_site1 = SiteFactory.build(site_id=1, name="Site 1")
    test_site2 = SiteFactory.build(site_id=2, name="Site 2")
    
    # Mock the database query to return the associations
    with patch('auth.services.db.session.query') as mock_query:
        # Create a mock query result that returns user-site pairs
        mock_result = [
            (MagicMock(user_id=1, site_id=1, role="admin"), test_site1),
            (MagicMock(user_id=1, site_id=2, role="editor"), test_site2)
        ]
        mock_query.return_value.join.return_value.filter.return_value.all.return_value = mock_result
        
        # Call get_user_sites with the user ID
        sites = get_user_sites(test_user)
        
        # Assert that the correct sites are returned
        assert len(sites) == 2
        assert sites[0]["id"] == 1
        assert sites[0]["name"] == "Site 1"
        assert sites[0]["role"] == "admin"
        assert sites[1]["id"] == 2
        assert sites[1]["name"] == "Site 2"
        assert sites[1]["role"] == "editor"


@pytest.mark.unit
def test_site_context_filter():
    """Tests the site context filter middleware"""
    # Create a mock request with a valid token containing site access information
    mock_request = MagicMock()
    mock_token_data = {"sub": 1, "sites": [1, 2, 3]}
    
    # Create an instance of SiteContextFilter
    site_filter = SiteContextFilter()
    
    with patch('auth.middlewares.validate_auth_token', return_value=mock_token_data):
        # Call the filter method
        site_filter.before_request(mock_request)
        
        # Assert that the site context is correctly set in the request object
        assert hasattr(mock_request, 'site_context')
        assert mock_request.site_context['id'] in mock_token_data['sites']


@pytest.mark.unit
def test_site_context_filter_no_sites():
    """Tests the site context filter when user has no site access"""
    # Create a mock request with a valid token containing no site access
    mock_request = MagicMock()
    mock_token_data = {"sub": 1, "sites": []}
    
    # Create an instance of SiteContextFilter
    site_filter = SiteContextFilter()
    
    with patch('auth.middlewares.validate_auth_token', return_value=mock_token_data):
        # Call the filter method
        with pytest.raises(Exception) as excinfo:
            site_filter.before_request(mock_request)
        
        # Assert that an appropriate error is raised or handled
        assert "site" in str(excinfo.value).lower()


@pytest.mark.unit
def test_jwt_required_decorator():
    """Tests the jwt_required decorator for protecting routes"""
    # Create a mock Flask route function
    mock_route_function = Mock(return_value="route_result")
    
    # Apply the jwt_required decorator to the function
    protected_route = jwt_required(mock_route_function)
    
    # Call the decorated function with a mock request containing a valid token
    with patch('auth.middlewares.g', user=MagicMock()):
        result = protected_route()
        
        # Assert that the original function is called
        mock_route_function.assert_called_once()
        assert result == "route_result"
    
    # Reset mock for next test
    mock_route_function.reset_mock()
    
    # Call the decorated function with a mock request containing an invalid token
    with patch('auth.middlewares.g', spec=[]), \
         pytest.raises(Exception) as excinfo:
        protected_route()
        
        # Assert that an authentication error is raised and the original function is not called
        assert "authentication" in str(excinfo.value).lower()
        mock_route_function.assert_not_called()


@pytest.mark.unit
def test_max_login_attempts():
    """Tests the maximum login attempts functionality"""
    # Create test user
    test_user = UserFactory.build(username="testuser")
    test_user.password_hash = hash_password("correctpassword")
    
    # Mock the database query to return the test user
    with patch('auth.services.User.query') as mock_query, \
         patch('auth.services.redis_client') as mock_redis:
        mock_query.filter_by.return_value.first.return_value = test_user
        
        # Set up mock redis to track login attempts
        mock_redis.get.side_effect = [None, "1", "2", "3", "4", "1"]  # First returns None, then counts, then lockout flag
        
        # Call authenticate_user with invalid credentials multiple times
        for i in range(5):
            try:
                authenticate_user("testuser", "wrongpassword")
            except Exception:
                pass  # Expected to raise an exception
        
        # Verify that after 5 failed attempts, the account is locked
        mock_redis.set.assert_called_with("account_locked:testuser", "1", ex=15*60)
        
        # Set up mock to simulate locked account
        mock_redis.get.return_value = "1"  # Account is locked
        
        # Attempt to authenticate with valid credentials
        with pytest.raises(Exception) as excinfo:
            authenticate_user("testuser", "correctpassword")
        
        # Assert that authentication fails due to account lockout
        assert "locked" in str(excinfo.value).lower()