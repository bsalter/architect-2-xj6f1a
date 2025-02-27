"""
Integration tests for the Sites API endpoints, verifying proper authentication,
authorization, and site-scoping behavior for site management operations.
"""
import pytest
import json
import http  # v3.0

from src.backend.tests.conftest import client  # fixture
from src.backend.tests.conftest import auth_token  # fixture
from src.backend.tests.conftest import auth_headers  # fixture
from src.backend.tests.conftest import admin_user  # fixture
from src.backend.tests.conftest import test_site  # fixture
from src.backend.tests.conftest import secondary_site  # fixture
from src.backend.tests.conftest import db_session  # fixture
from src.backend.sites.models import Site  # class
from src.backend.auth.models import User  # class


def test_get_sites(client, auth_headers, test_site):
    """Test getting the list of sites that the authenticated user has access to"""
    # Make a GET request to /api/sites endpoint with auth_headers
    response = client.get("/api/sites", headers=auth_headers)

    # Assert response status code is 200 OK
    assert response.status_code == 200

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the response contains a list of sites in data.sites
    assert 'data' in data
    assert 'sites' in data['data']
    sites = data['data']['sites']
    assert isinstance(sites, list)

    # Verify at least one site is returned (the test_site)
    assert len(sites) > 0

    # Verify the test_site is in the returned sites list
    site_names = [site['name'] for site in sites]
    assert test_site.name in site_names

    # Verify each site has id, name, and description fields
    for site in sites:
        assert 'id' in site
        assert 'name' in site
        assert 'description' in site


def test_get_site_by_id(client, auth_headers, test_site):
    """Test getting a single site by ID that the user has access to"""
    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Make a GET request to /api/sites/{site_id} endpoint with auth_headers
    response = client.get(f"/api/sites/{site_id}", headers=auth_headers)

    # Assert response status code is 200 OK
    assert response.status_code == 200

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the response contains site details in data.site
    assert 'data' in data
    assert 'site' in data['data']
    site = data['data']['site']

    # Verify the returned site has the correct id, name, and description matching test_site
    assert site['id'] == site_id
    assert site['name'] == test_site.name
    assert site['description'] == test_site.description


def test_get_site_unauthorized(client, auth_headers, secondary_site, user_with_site):
    """Test attempting to access a site the user doesn't have access to"""
    # Extract site_id from the secondary_site fixture (a site the user doesn't have access to)
    site_id = secondary_site.site_id

    # Make a GET request to /api/sites/{site_id} endpoint with auth_headers
    response = client.get(f"/api/sites/{site_id}", headers=auth_headers)

    # Assert response status code is 403 Forbidden
    assert response.status_code == 403

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about lacking site access
    assert 'message' in data['error']
    assert "You do not have access to this site" in data['error']['message']


def test_get_site_not_found(client, auth_headers):
    """Test getting a non-existent site returns a 404 error"""
    # Create a non-existent site ID (e.g., 99999)
    non_existent_id = 99999

    # Make a GET request to /api/sites/{non_existent_id} endpoint with auth_headers
    response = client.get(f"/api/sites/{non_existent_id}", headers=auth_headers)

    # Assert response status code is 404 Not Found
    assert response.status_code == 404

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about site not found
    assert 'message' in data['error']
    assert f"Site with ID {non_existent_id} not found" in data['error']['message']


def test_create_site_admin(client, admin_user, db_session):
    """Test creating a new site with admin privileges"""
    # Generate an admin auth token for the admin_user
    admin_auth_token = admin_user.id

    # Create admin auth headers with the token
    admin_auth_headers = {'Authorization': f'Bearer {admin_auth_token}', 'Content-Type': 'application/json'}

    # Prepare site data with a unique name and description
    site_data = {
        "name": "New Test Site",
        "description": "A new test site created by admin"
    }

    # Make a POST request to /api/sites endpoint with admin auth headers and site data
    response = client.post("/api/sites", headers=admin_auth_headers, json=site_data)

    # Assert response status code is 201 Created
    assert response.status_code == 201

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the response contains the created site data with an id
    assert 'id' in data
    assert data['name'] == site_data['name']
    assert data['description'] == site_data['description']

    # Verify the site exists in the database using Site.query
    site = db_session.query(Site).filter_by(name=site_data['name']).first()
    assert site is not None

    # Verify the site properties in the database match what was submitted
    assert site.name == site_data['name']
    assert site.description == site_data['description']


def test_create_site_unauthorized(client, auth_headers):
    """Test that non-admin users cannot create sites"""
    # Prepare site data with a name and description
    site_data = {
        "name": "Unauthorized Site",
        "description": "A site that regular users cannot create"
    }

    # Make a POST request to /api/sites endpoint with regular user auth headers and site data
    response = client.post("/api/sites", headers=auth_headers, json=site_data)

    # Assert response status code is 403 Forbidden
    assert response.status_code == 403

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about insufficient permissions
    assert 'message' in data['error']
    assert "Only site administrators can create sites" in data['error']['message']


def test_update_site_admin(client, admin_user, test_site, db_session):
    """Test updating an existing site with admin privileges"""
    # Generate an admin auth token for the admin_user
    admin_auth_token = admin_user.id

    # Create admin auth headers with the token
    admin_auth_headers = {'Authorization': f'Bearer {admin_auth_token}', 'Content-Type': 'application/json'}

    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Prepare updated site data with new name and description
    updated_site_data = {
        "name": "Updated Test Site",
        "description": "An updated test site description"
    }

    # Make a PUT request to /api/sites/{site_id} endpoint with admin auth headers and updated data
    response = client.put(f"/api/sites/{site_id}", headers=admin_auth_headers, json=updated_site_data)

    # Assert response status code is 200 OK
    assert response.status_code == 200

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the response contains the updated site data
    assert 'id' in data
    assert data['name'] == updated_site_data['name']
    assert data['description'] == updated_site_data['description']

    # Verify the site properties in the database have been updated correctly
    site = db_session.query(Site).filter_by(site_id=site_id).first()
    assert site.name == updated_site_data['name']
    assert site.description == updated_site_data['description']


def test_update_site_unauthorized(client, auth_headers, test_site):
    """Test that non-admin users cannot update sites"""
    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Prepare updated site data with new name and description
    updated_site_data = {
        "name": "Unauthorized Update",
        "description": "Attempted update by regular user"
    }

    # Make a PUT request to /api/sites/{site_id} endpoint with regular user auth headers and updated data
    response = client.put(f"/api/sites/{site_id}", headers=auth_headers, json=updated_site_data)

    # Assert response status code is 403 Forbidden
    assert response.status_code == 403

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about insufficient permissions
    assert 'message' in data['error']
    assert "Only site administrators can update site details" in data['error']['message']


def test_delete_site_admin(client, admin_user, db_session):
    """Test deleting a site with admin privileges"""
    # Create a test site specifically for deletion
    site_data = {
        "name": "Site to Delete",
        "description": "A temporary site for deletion testing"
    }
    site = Site(name=site_data["name"], description=site_data["description"])
    db_session.add(site)
    db_session.commit()
    site_id = site.site_id

    # Generate an admin auth token for the admin_user
    admin_auth_token = admin_user.id

    # Create admin auth headers with the token
    admin_auth_headers = {'Authorization': f'Bearer {admin_auth_token}', 'Content-Type': 'application/json'}

    # Make a DELETE request to /api/sites/{site_id} endpoint with admin auth headers
    response = client.delete(f"/api/sites/{site_id}", headers=admin_auth_headers)

    # Assert response status code is 200 OK
    assert response.status_code == 200

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the site no longer exists in the database or is marked as inactive
    deleted_site = db_session.query(Site).filter_by(site_id=site_id).first()
    assert deleted_site is None or deleted_site.is_active is False


def test_delete_site_unauthorized(client, auth_headers, test_site):
    """Test that non-admin users cannot delete sites"""
    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Make a DELETE request to /api/sites/{site_id} endpoint with regular user auth headers
    response = client.delete(f"/api/sites/{site_id}", headers=auth_headers)

    # Assert response status code is 403 Forbidden
    assert response.status_code == 403

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about insufficient permissions
    assert 'message' in data['error']
    assert "Only site administrators can delete sites" in data['error']['message']

    # Verify the site still exists in the database
    site = db_session.query(Site).filter_by(site_id=site_id).first()
    assert site is not None


def test_get_site_users(client, auth_headers, test_site, user_with_site):
    """Test getting the list of users associated with a site"""
    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Make a GET request to /api/sites/{site_id}/users endpoint with auth_headers
    response = client.get(f"/api/sites/{site_id}/users", headers=auth_headers)

    # Assert response status code is 200 OK
    assert response.status_code == 200

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the response contains a list of users in data.users
    assert 'data' in data
    assert 'users' in data['data']
    users = data['data']['users']
    assert isinstance(users, list)

    # Verify at least one user is returned (the user_with_site)
    assert len(users) > 0

    # Verify each user has id, username, and email fields
    for user in users:
        assert 'id' in user
        assert 'username' in user
        assert 'email' in user

    # Verify the user_with_site is in the returned users list
    user_ids = [user['id'] for user in users]
    assert user_with_site.id in user_ids


def test_get_site_users_unauthorized(client, auth_headers, secondary_site):
    """Test that users cannot see users of sites they don't have access to"""
    # Extract site_id from the secondary_site fixture (a site the user doesn't have access to)
    site_id = secondary_site.site_id

    # Make a GET request to /api/sites/{site_id}/users endpoint with auth_headers
    response = client.get(f"/api/sites/{site_id}/users", headers=auth_headers)

    # Assert response status code is 403 Forbidden
    assert response.status_code == 403

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about lacking site access
    assert 'message' in data['error']
    assert "You do not have access to this site" in data['error']['message']


def test_set_active_site(client, auth_headers, test_site):
    """Test setting the active site context"""
    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Prepare request data with the site_id to set as active
    request_data = {"site_id": site_id}

    # Make a POST request to /api/sites/active endpoint with auth_headers and request data
    response = client.post("/api/sites/active", headers=auth_headers, json=request_data)

    # Assert response status code is 200 OK
    assert response.status_code == 200

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'success' status
    assert 'status' in data
    assert data['status'] == 'success'

    # Verify the response contains current_site data
    assert 'data' in data
    assert 'current_site' in data['data']
    current_site = data['data']['current_site']

    # Verify the current_site in the response matches the test_site id
    assert current_site['id'] == site_id


def test_set_active_site_unauthorized(client, auth_headers, secondary_site):
    """Test that users cannot set active site they don't have access to"""
    # Extract site_id from the secondary_site fixture (a site the user doesn't have access to)
    site_id = secondary_site.site_id

    # Prepare request data with the unauthorized site_id
    request_data = {"site_id": site_id}

    # Make a POST request to /api/sites/active endpoint with auth_headers and request data
    response = client.post("/api/sites/active", headers=auth_headers, json=request_data)

    # Assert response status code is 403 Forbidden
    assert response.status_code == 403

    # Parse the JSON response
    data = json.loads(response.data)

    # Verify the response contains 'error' status
    assert 'status' in data
    assert data['status'] == 'error'

    # Verify the response contains an appropriate error message about lacking site access
    assert 'message' in data['error']
    assert "You do not have access to this site" in data['error']['message']


def test_unauthenticated_access(client, test_site):
    """Test that unauthenticated requests are properly rejected"""
    # Extract site_id from the test_site fixture
    site_id = test_site.site_id

    # Make a GET request to /api/sites endpoint without auth headers
    response = client.get("/api/sites")
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'status' in data
    assert data['status'] == 'error'
    assert "Authentication required" in data['error']['message']

    # Make a GET request to /api/sites/{site_id} endpoint without auth headers
    response = client.get(f"/api/sites/{site_id}")
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'status' in data
    assert data['status'] == 'error'
    assert "Authentication required" in data['error']['message']

    # Make a GET request to /api/sites/{site_id}/users endpoint without auth headers
    response = client.get(f"/api/sites/{site_id}/users")
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'status' in data
    assert data['status'] == 'error'
    assert "Authentication required" in data['error']['message']