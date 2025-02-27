"""
Integration tests for the Interaction API endpoints.

This module contains integration tests that validate CRUD operations, search functionality,
pagination, and site-scoping for the Interaction API endpoints. It ensures proper
authentication, request validation, and response formatting.
"""

import pytest
import json
from datetime import datetime, timedelta
from dateutil import parser as dateutil_parser

from ..factories import InteractionFactory
from ...interactions.models import Interaction


@pytest.mark.integration
def test_get_interactions_authenticated(client, auth_headers, user_with_site, test_site, multiple_interactions):
    """Test that authenticated users can retrieve interactions for their site."""
    # Make GET request to /api/interactions/ with auth_headers
    response = client.get('/api/interactions/', headers=auth_headers)
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response data
    data = json.loads(response.data)
    
    # Verify response contains 'interactions' key with list of interactions
    assert 'interactions' in data
    assert isinstance(data['interactions'], list)
    
    # Verify pagination metadata is correct (total, page, page_size)
    assert 'meta' in data
    assert 'pagination' in data['meta']
    assert 'total' in data['meta']['pagination']
    assert 'page' in data['meta']['pagination']
    assert 'page_size' in data['meta']['pagination']
    
    # Verify all interactions belong to test_site
    for interaction in data['interactions']:
        assert interaction['site_id'] == test_site.site_id
    
    # Verify interaction schema matches expected structure
    if data['interactions']:
        interaction = data['interactions'][0]
        expected_fields = [
            'interaction_id', 'site_id', 'title', 'type', 'lead',
            'start_datetime', 'timezone', 'end_datetime', 'location',
            'description', 'notes', 'created_by', 'created_at',
            'updated_by', 'updated_at'
        ]
        for field in expected_fields:
            assert field in interaction


@pytest.mark.integration
def test_get_interactions_unauthenticated(client):
    """Test that unauthenticated users cannot retrieve interactions."""
    # Make GET request to /api/interactions/ without auth headers
    response = client.get('/api/interactions/')
    
    # Verify response status code is 401 Unauthorized
    assert response.status_code == 401


@pytest.mark.integration
def test_get_interactions_site_scoping(client, user_with_site, test_site, secondary_site, multiple_interactions, site_interactions):
    """Test that users can only retrieve interactions from their authorized sites."""
    # Create auth token for user with only test_site access
    from ...auth.utils import create_access_token
    token = create_access_token(identity=user_with_site.user_id, additional_claims={'sites': [test_site.site_id]})
    
    # Generate auth headers with token
    auth_headers = {'Authorization': f'Bearer {token}'}
    
    # Make GET request to /api/interactions/ with auth headers
    response = client.get('/api/interactions/', headers=auth_headers)
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response
    data = json.loads(response.data)
    
    # Get interactions for both sites
    test_site_interactions = site_interactions(test_site)
    secondary_site_interactions = site_interactions(secondary_site)
    
    # Verify response only contains interactions from test_site
    test_site_ids = {interaction.interaction_id for interaction in test_site_interactions}
    secondary_site_ids = {interaction.interaction_id for interaction in secondary_site_interactions}
    response_ids = {interaction['interaction_id'] for interaction in data['interactions']}
    
    # All returned interactions should be from test_site
    assert response_ids.issubset(test_site_ids)
    
    # No interactions from secondary_site should be returned
    assert response_ids.isdisjoint(secondary_site_ids)


@pytest.mark.integration
def test_get_interaction_by_id(client, auth_headers, test_interaction):
    """Test retrieving a specific interaction by ID."""
    # Make GET request to /api/interactions/{test_interaction.interaction_id} with auth_headers
    response = client.get(f'/api/interactions/{test_interaction.interaction_id}', headers=auth_headers)
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response data
    data = json.loads(response.data)
    
    # Verify interaction details match test_interaction
    assert data['interaction_id'] == test_interaction.interaction_id
    assert data['title'] == test_interaction.title
    assert data['type'] == test_interaction.type
    assert data['lead'] == test_interaction.lead
    assert data['site_id'] == test_interaction.site_id
    
    # Verify datetime fields by parsing
    start_dt = dateutil_parser.parse(data['start_datetime'])
    assert start_dt.replace(microsecond=0) == test_interaction.start_datetime.replace(microsecond=0)
    
    # Verify all expected fields are present in the response
    expected_fields = [
        'interaction_id', 'site_id', 'title', 'type', 'lead',
        'start_datetime', 'timezone', 'end_datetime', 'location',
        'description', 'notes', 'created_by', 'created_at',
        'updated_by', 'updated_at'
    ]
    for field in expected_fields:
        assert field in data


@pytest.mark.integration
def test_get_interaction_not_found(client, auth_headers):
    """Test proper error handling when requesting non-existent interaction."""
    # Make GET request to /api/interactions/9999 (non-existent ID) with auth_headers
    response = client.get('/api/interactions/9999', headers=auth_headers)
    
    # Verify response status code is 404 Not Found
    assert response.status_code == 404
    
    # Verify error response contains appropriate message
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'not found' in data['error']['message'].lower()


@pytest.mark.integration
def test_get_interaction_wrong_site(client, user_with_site, secondary_site, site_interactions):
    """Test that users cannot access interactions from sites they don't have access to."""
    # Create an interaction in secondary_site
    secondary_interactions = site_interactions(secondary_site)
    secondary_interaction = secondary_interactions[0] if secondary_interactions else None
    
    if secondary_interaction is None:
        pytest.skip("No interaction available for secondary site")
    
    # Create auth token for user with only test_site access
    from ...auth.utils import create_access_token
    # Get the user's sites
    user_site_ids = user_with_site.get_site_ids()
    # Make sure we're using a site that's not the secondary site
    token = create_access_token(identity=user_with_site.user_id, additional_claims={'sites': user_site_ids})
    
    # Generate auth headers with token
    auth_headers = {'Authorization': f'Bearer {token}'}
    
    # Make GET request to /api/interactions/{secondary_site_interaction.interaction_id} with auth headers
    response = client.get(f'/api/interactions/{secondary_interaction.interaction_id}', headers=auth_headers)
    
    # Verify response status code is 404 Not Found
    assert response.status_code == 404
    
    # Verify error response indicates interaction not found (not revealing existence)
    data = json.loads(response.data)
    assert 'error' in data
    assert 'message' in data['error']
    assert 'not found' in data['error']['message'].lower()


@pytest.mark.integration
def test_create_interaction(client, auth_headers, user_with_site, test_site):
    """Test creating a new interaction."""
    # Create valid interaction data dictionary
    interaction_data = {
        'title': 'New Test Interaction',
        'type': 'Meeting',
        'lead': 'John Doe',
        'start_datetime': (datetime.now() + timedelta(days=1)).isoformat(),
        'timezone': 'America/New_York',
        'end_datetime': (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
        'location': 'Conference Room A',
        'description': 'This is a test interaction',
        'notes': 'Additional notes for testing'
    }
    
    # Make POST request to /api/interactions/ with auth_headers and JSON data
    response = client.post(
        '/api/interactions/',
        headers=auth_headers,
        data=json.dumps(interaction_data),
        content_type='application/json'
    )
    
    # Verify response status code is 201 Created
    assert response.status_code == 201
    
    # Parse JSON response data
    data = json.loads(response.data)
    
    # Verify created interaction contains all provided attributes
    for key, value in interaction_data.items():
        if key in ['start_datetime', 'end_datetime']:  # Special handling for datetime
            continue
        assert data[key] == value
    
    # Verify site_id matches user's site
    assert data['site_id'] == test_site.site_id
    
    # Verify created_by matches user's ID
    assert data['created_by'] == user_with_site.user_id
    
    # Query database to confirm interaction was saved
    from ...extensions import db
    saved_interaction = db.session.query(Interaction).filter_by(interaction_id=data['interaction_id']).first()
    assert saved_interaction is not None
    assert saved_interaction.title == interaction_data['title']


@pytest.mark.integration
def test_create_interaction_validation_error(client, auth_headers):
    """Test validation errors when creating a new interaction with invalid data."""
    # Create invalid interaction data (missing required fields, invalid data types)
    invalid_interaction_data = {
        'title': '',  # Empty title
        'type': 'InvalidType',  # Invalid type
        'start_datetime': 'not-a-date',  # Invalid date format
        # Missing required fields: lead, timezone
    }
    
    # Make POST request to /api/interactions/ with auth_headers and invalid JSON data
    response = client.post(
        '/api/interactions/',
        headers=auth_headers,
        data=json.dumps(invalid_interaction_data),
        content_type='application/json'
    )
    
    # Verify response status code is 400 Bad Request
    assert response.status_code == 400
    
    # Verify response contains validation error details
    data = json.loads(response.data)
    assert 'error' in data
    assert 'errors' in data['error']
    
    # Verify specific field errors are identified in the response
    errors = data['error']['errors']
    assert 'title' in errors  # Empty title
    assert 'type' in errors  # Invalid type
    assert 'start_datetime' in errors  # Invalid date format
    assert 'lead' in errors  # Missing field
    assert 'timezone' in errors  # Missing field


@pytest.mark.integration
def test_update_interaction(client, auth_headers, test_interaction):
    """Test updating an existing interaction."""
    # Create update data with modified fields
    update_data = {
        'title': 'Updated Interaction Title',
        'type': 'Call',  # Changed from original
        'lead': 'Jane Smith',  # Changed from original
        'notes': 'Updated notes for testing'
    }
    
    # Make PUT request to /api/interactions/{test_interaction.interaction_id} with auth_headers and JSON data
    response = client.put(
        f'/api/interactions/{test_interaction.interaction_id}',
        headers=auth_headers,
        data=json.dumps(update_data),
        content_type='application/json'
    )
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response data
    data = json.loads(response.data)
    
    # Verify interaction fields are updated with new values
    for key, value in update_data.items():
        assert data[key] == value
    
    # Verify unchanged fields retain their original values
    assert data['interaction_id'] == test_interaction.interaction_id
    assert data['site_id'] == test_interaction.site_id
    
    # Verify updated_by reflects the current user
    assert data['updated_by'] is not None
    
    # Verify updated_at is more recent than created_at
    updated_at = dateutil_parser.parse(data['updated_at'])
    created_at = dateutil_parser.parse(data['created_at'])
    assert updated_at > created_at


@pytest.mark.integration
def test_update_interaction_validation_error(client, auth_headers, test_interaction):
    """Test validation errors when updating an interaction with invalid data."""
    # Create invalid update data (invalid data types, constraint violations)
    invalid_update_data = {
        'title': 'x' * 300,  # Too long for column
        'type': 'InvalidType',  # Invalid type
        'start_datetime': '2023-01-01T10:00:00',
        'end_datetime': '2023-01-01T09:00:00'  # End before start (constraint violation)
    }
    
    # Make PUT request to /api/interactions/{test_interaction.interaction_id} with auth_headers and invalid data
    response = client.put(
        f'/api/interactions/{test_interaction.interaction_id}',
        headers=auth_headers,
        data=json.dumps(invalid_update_data),
        content_type='application/json'
    )
    
    # Verify response status code is 400 Bad Request
    assert response.status_code == 400
    
    # Verify response contains validation error details
    data = json.loads(response.data)
    assert 'error' in data
    assert 'errors' in data['error']
    
    # Verify specific field errors are identified in the response
    errors = data['error']['errors']
    assert 'title' in errors  # Too long
    assert 'type' in errors  # Invalid type
    assert 'end_datetime' in errors  # End before start


@pytest.mark.integration
def test_delete_interaction(client, auth_headers, test_interaction, db_session):
    """Test deleting an interaction."""
    interaction_id = test_interaction.interaction_id
    
    # Make DELETE request to /api/interactions/{test_interaction.interaction_id} with auth_headers
    response = client.delete(
        f'/api/interactions/{interaction_id}',
        headers=auth_headers
    )
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Verify success message in response
    data = json.loads(response.data)
    assert 'success' in data
    assert data['success'] is True
    
    # Query database to confirm interaction was deleted
    deleted_interaction = db_session.query(Interaction).filter_by(interaction_id=interaction_id).first()
    assert deleted_interaction is None
    
    # Attempt to GET the deleted interaction
    get_response = client.get(
        f'/api/interactions/{interaction_id}',
        headers=auth_headers
    )
    
    # Verify GET request returns 404 Not Found
    assert get_response.status_code == 404


@pytest.mark.integration
def test_delete_interaction_wrong_site(client, user_with_site, secondary_site, site_interactions):
    """Test that users cannot delete interactions from sites they don't have access to."""
    # Create an interaction in secondary_site
    secondary_interactions = site_interactions(secondary_site)
    secondary_interaction = secondary_interactions[0] if secondary_interactions else None
    
    if secondary_interaction is None:
        pytest.skip("No interaction available for secondary site")
    
    # Create auth token for user with only test_site access
    from ...auth.utils import create_access_token
    # Get the user's sites
    user_site_ids = user_with_site.get_site_ids()
    # Make sure we're using a site that's not the secondary site
    token = create_access_token(identity=user_with_site.user_id, additional_claims={'sites': user_site_ids})
    
    # Generate auth headers with token
    auth_headers = {'Authorization': f'Bearer {token}'}
    
    # Make DELETE request to /api/interactions/{secondary_site_interaction.interaction_id} with auth headers
    response = client.delete(
        f'/api/interactions/{secondary_interaction.interaction_id}',
        headers=auth_headers
    )
    
    # Verify response status code is 404 Not Found
    assert response.status_code == 404
    
    # Query database to confirm interaction still exists
    from ...extensions import db
    interaction = db.session.query(Interaction).filter_by(interaction_id=secondary_interaction.interaction_id).first()
    assert interaction is not None


@pytest.mark.integration
def test_search_interactions(client, auth_headers, multiple_interactions):
    """Test searching interactions with various criteria."""
    # Generate search criteria (e.g., title, type, lead)
    # Let's assume we know at least one interaction exists with these properties
    search_term = multiple_interactions[0].title[:10]  # First part of the title
    
    # Make GET request to /api/interactions/?search=[criteria] with auth_headers
    response = client.get(
        f'/api/interactions/?search={search_term}',
        headers=auth_headers
    )
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response data
    data = json.loads(response.data)
    
    # Verify only matching interactions are returned
    for interaction in data['interactions']:
        # Search can match any of these fields
        match_found = False
        for field in ['title', 'lead', 'description', 'notes', 'type', 'location']:
            if field in interaction and interaction[field] and search_term.lower() in interaction[field].lower():
                match_found = True
                break
        assert match_found
    
    # Verify pagination metadata is correct
    assert 'meta' in data
    assert 'pagination' in data['meta']
    
    # Test multiple search parameters combined
    type_filter = multiple_interactions[0].type
    response = client.get(
        f'/api/interactions/?search={search_term}&type={type_filter}',
        headers=auth_headers
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Verify AND logic applied to multiple search criteria
    for interaction in data['interactions']:
        # Verify type matches exactly
        assert interaction['type'] == type_filter
        
        # Verify search term matches some field
        match_found = False
        for field in ['title', 'lead', 'description', 'notes', 'location']:
            if field in interaction and interaction[field] and search_term.lower() in interaction[field].lower():
                match_found = True
                break
        assert match_found


@pytest.mark.integration
def test_interaction_pagination(client, auth_headers, multiple_interactions):
    """Test pagination of interaction results."""
    # Make GET request to /api/interactions/?page=1&page_size=10 with auth_headers
    response = client.get(
        '/api/interactions/?page=1&page_size=10',
        headers=auth_headers
    )
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response
    data = json.loads(response.data)
    
    # Verify pagination metadata
    assert 'meta' in data
    assert 'pagination' in data['meta']
    pagination = data['meta']['pagination']
    assert 'total' in pagination
    assert 'page' in pagination
    assert 'page_size' in pagination
    assert 'total_pages' in pagination
    
    # If there are more than 10 total interactions, verify page size and has_next
    total_interactions = pagination['total']
    
    # Verify exactly 10 interactions returned if enough exist
    if total_interactions > 10:
        assert len(data['interactions']) == 10
        assert pagination['has_next'] is True
    else:
        assert len(data['interactions']) == total_interactions
        assert pagination['has_next'] is False
    
    # If there are at least 2 pages, test second page
    if pagination['total_pages'] > 1:
        # Make GET request for page 2
        response_page2 = client.get(
            '/api/interactions/?page=2&page_size=10',
            headers=auth_headers
        )
        assert response_page2.status_code == 200
        data_page2 = json.loads(response_page2.data)
        
        # Verify different interactions returned on page 2
        page1_ids = {interaction['interaction_id'] for interaction in data['interactions']}
        page2_ids = {interaction['interaction_id'] for interaction in data_page2['interactions']}
        
        # No overlap between pages
        assert page1_ids.isdisjoint(page2_ids)
        
        # Verify consistency of results across pages
        # Check that total and page_size are consistent
        assert data_page2['meta']['pagination']['total'] == pagination['total']
        assert data_page2['meta']['pagination']['page_size'] == pagination['page_size']
        assert data_page2['meta']['pagination']['page'] == 2


@pytest.mark.integration
def test_get_interaction_types(client, auth_headers):
    """Test retrieving the list of valid interaction types."""
    # Make GET request to /api/interactions/types with auth_headers
    response = client.get(
        '/api/interactions/types',
        headers=auth_headers
    )
    
    # Verify response status code is 200 OK
    assert response.status_code == 200
    
    # Parse JSON response
    data = json.loads(response.data)
    
    # Verify response contains array of type values
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Verify expected interaction types are included (Meeting, Call, etc.)
    expected_types = ["Meeting", "Call", "Email", "Update", "Training", "Review", 
                      "Presentation", "Conference", "Workshop", "Other"]
    for expected_type in expected_types:
        assert expected_type in data