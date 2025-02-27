"""
Integration tests for site-scoping functionality, verifying that users can only access interaction data from sites they are associated with. These tests ensure proper data isolation in the multi-tenant architecture of the Interaction Management System.
"""

import pytest
import json
import datetime
from typing import Dict, List, Optional
from flask import url_for, g

from ...auth.utils import create_auth_token
from ...api.error_handlers import AuthorizationError
from ..factories import UserFactory, SiteFactory, UserSiteFactory, InteractionFactory


@pytest.mark.integration
def test_site_scoping_middleware_active(client, db_session, user_with_site, test_site):
    """Test that site-scoping middleware is active and restricts access to authorized sites only."""
    # Create a JWT token with user's site ID
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Make a request to get all interactions with the token
    response = client.get(
        "/api/interactions",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify response is successful (200)
    assert response.status_code == 200
    
    # Verify site context is correctly applied in the response
    data = json.loads(response.data)
    assert "site_context" in data
    assert data["site_context"]["id"] == test_site.id


@pytest.mark.integration
def test_site_scoping_blocks_unauthorized_site_access(client, db_session, test_user, test_site, secondary_site):
    """Test that site-scoping blocks access to sites the user is not associated with."""
    # Associate user with only the first site
    UserSiteFactory(user=test_user, site=test_site, role="Editor")
    
    # Create a JWT token with unauthorized site ID (secondary_site)
    token = create_auth_token(test_user.id, [secondary_site.id])
    
    # Make a request to get all interactions with the token
    response = client.get(
        "/api/interactions",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify response is forbidden (403)
    assert response.status_code == 403
    
    # Verify the error message indicates site access is forbidden
    data = json.loads(response.data)
    assert "error" in data
    assert "forbidden" in data["error"]["message"].lower()


@pytest.mark.integration
def test_interaction_creation_enforces_site_scoping(client, db_session, user_with_site, test_site, secondary_site):
    """Test that creating an interaction enforces site-scoping rules."""
    # Create interaction data for the authorized site
    interaction_data = {
        "title": "Test Interaction",
        "type": "Meeting",
        "lead": "John Doe",
        "start_datetime": datetime.datetime.now().isoformat(),
        "end_datetime": (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat(),
        "timezone": "America/New_York",
        "location": "Conference Room A",
        "description": "Test description",
        "notes": "Test notes",
        "site_id": test_site.id
    }
    
    # Create a JWT token with user's site ID
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Make a POST request to create an interaction
    response = client.post(
        "/api/interactions",
        json=interaction_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the creation is successful (201)
    assert response.status_code == 201
    
    # Try to create an interaction with a different site_id
    interaction_data["site_id"] = secondary_site.id
    
    # Make a POST request to create an interaction with unauthorized site
    response = client.post(
        "/api/interactions",
        json=interaction_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the creation is forbidden (403)
    assert response.status_code == 403


@pytest.mark.integration
def test_interaction_retrieval_enforces_site_scoping(client, db_session, user_with_site, test_site, secondary_site):
    """Test that retrieving interactions enforces site-scoping rules."""
    # Create an interaction for the test_site
    interaction1 = InteractionFactory(site=test_site, created_by=user_with_site.id)
    
    # Create an interaction for the secondary_site
    interaction2 = InteractionFactory(site=secondary_site, created_by=user_with_site.id)
    
    # Commit to the database
    db_session.commit()
    
    # Create a JWT token with user's site ID (test_site)
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Make a GET request to get all interactions
    response = client.get(
        "/api/interactions",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify we only get interactions from the authorized site
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check that we have interactions and they're all from the authorized site
    assert "interactions" in data
    assert len(data["interactions"]) > 0
    for interaction in data["interactions"]:
        assert interaction["site_id"] == test_site.id
    
    # Make a GET request to get the specific interaction from secondary_site
    response = client.get(
        f"/api/interactions/{interaction2.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the request is forbidden (404 not found)
    assert response.status_code == 404


@pytest.mark.integration
def test_interaction_update_enforces_site_scoping(client, db_session, user_with_site, test_site, secondary_site):
    """Test that updating interactions enforces site-scoping rules."""
    # Create an interaction for the test_site
    interaction1 = InteractionFactory(site=test_site, created_by=user_with_site.id)
    
    # Create an interaction for the secondary_site
    interaction2 = InteractionFactory(site=secondary_site, created_by=user_with_site.id)
    
    # Commit to the database
    db_session.commit()
    
    # Create a JWT token with user's site ID (test_site)
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Make a PUT request to update the interaction from test_site
    update_data = {
        "title": "Updated Interaction",
        "type": "Meeting",
        "lead": "John Doe",
        "start_datetime": datetime.datetime.now().isoformat(),
        "end_datetime": (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat(),
        "timezone": "America/New_York"
    }
    
    response = client.put(
        f"/api/interactions/{interaction1.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the update is successful (200)
    assert response.status_code == 200
    
    # Make a PUT request to update the interaction from secondary_site
    response = client.put(
        f"/api/interactions/{interaction2.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the update is forbidden (404 not found)
    assert response.status_code == 404


@pytest.mark.integration
def test_interaction_deletion_enforces_site_scoping(client, db_session, user_with_site, test_site, secondary_site):
    """Test that deleting interactions enforces site-scoping rules."""
    # Create an interaction for the test_site
    interaction1 = InteractionFactory(site=test_site, created_by=user_with_site.id)
    
    # Create an interaction for the secondary_site
    interaction2 = InteractionFactory(site=secondary_site, created_by=user_with_site.id)
    
    # Commit to the database
    db_session.commit()
    
    # Create a JWT token with user's site ID (test_site)
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Make a DELETE request to delete the interaction from test_site
    response = client.delete(
        f"/api/interactions/{interaction1.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the deletion is successful (200)
    assert response.status_code == 200
    
    # Make a DELETE request to delete the interaction from secondary_site
    response = client.delete(
        f"/api/interactions/{interaction2.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify the deletion is forbidden (404 not found)
    assert response.status_code == 404


@pytest.mark.integration
def test_search_interactions_enforces_site_scoping(client, db_session, user_with_site, test_site, secondary_site):
    """Test that searching interactions enforces site-scoping rules."""
    # Create multiple interactions for test_site with a specific search term
    for i in range(3):
        InteractionFactory(
            site=test_site,
            created_by=user_with_site.id,
            title=f"Searchable Meeting {i}",
            type="Meeting"
        )
    
    # Create multiple interactions for secondary_site with the same search term
    for i in range(3):
        InteractionFactory(
            site=secondary_site,
            created_by=user_with_site.id,
            title=f"Searchable Meeting {i}",
            type="Meeting"
        )
    
    # Commit to the database
    db_session.commit()
    
    # Create a JWT token with user's site ID (test_site)
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Make a GET request to search interactions with the search term
    response = client.get(
        "/api/interactions?search=Searchable",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify we only get interactions from the authorized site
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check that we have interactions and they're all from the authorized site
    assert "interactions" in data
    assert "total" in data
    assert data["total"] == 3  # Only the 3 from test_site
    for interaction in data["interactions"]:
        assert interaction["site_id"] == test_site.id
        assert "Searchable Meeting" in interaction["title"]


@pytest.mark.integration
def test_user_with_multiple_sites_can_switch_context(client, db_session, user_with_multiple_sites, test_site, secondary_site):
    """Test that users with multiple site associations can switch site context."""
    # Create interactions for both test_site and secondary_site
    interaction1 = InteractionFactory(site=test_site, created_by=user_with_multiple_sites.id)
    interaction2 = InteractionFactory(site=secondary_site, created_by=user_with_multiple_sites.id)
    
    # Commit to the database
    db_session.commit()
    
    # Create a JWT token with both site IDs in the available_sites claim
    token = create_auth_token(user_with_multiple_sites.id, [test_site.id, secondary_site.id])
    
    # Make a GET request with test_site as the active site context
    response = client.get(
        "/api/interactions",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Site-ID": str(test_site.id)
        }
    )
    
    # Verify we only get interactions from test_site
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "interactions" in data
    assert data["site_context"]["id"] == test_site.id
    for interaction in data["interactions"]:
        assert interaction["site_id"] == test_site.id
    
    # Make another GET request with secondary_site as the active site context
    response = client.get(
        "/api/interactions",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Site-ID": str(secondary_site.id)
        }
    )
    
    # Verify we only get interactions from secondary_site
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "interactions" in data
    assert data["site_context"]["id"] == secondary_site.id
    for interaction in data["interactions"]:
        assert interaction["site_id"] == secondary_site.id
    
    # Verify the site context switch was successful
    assert data["site_context"]["available_sites"] == [test_site.id, secondary_site.id]


@pytest.mark.integration
def test_site_scoping_at_service_layer(client, db_session, app, user_with_site, test_site, secondary_site):
    """Test that site-scoping is enforced at the service layer directly."""
    # Create an interaction for each site
    interaction1 = InteractionFactory(site=test_site, created_by=user_with_site.id)
    interaction2 = InteractionFactory(site=secondary_site, created_by=user_with_site.id)
    
    # Commit to the database
    db_session.commit()
    
    # Get the InteractionService instance from the application
    from ...interactions.services import InteractionService
    service = InteractionService()
    
    # Set up the Flask g context with site_context
    with app.test_request_context():
        g.site_context = {"id": test_site.id, "available_sites": [test_site.id]}
        
        # Try to access interaction from the authorized site - should succeed
        interaction = service.get_interaction_by_id(interaction1.id)
        assert interaction is not None
        assert interaction.site_id == test_site.id
        
        # Try to access interaction from the unauthorized site - should raise AuthorizationError
        with pytest.raises(AuthorizationError):
            service.get_interaction_by_id(interaction2.id)


@pytest.mark.integration
def test_middleware_sets_site_context_in_flask_g(client, db_session, user_with_site, test_site, app):
    """Test that the auth middleware correctly sets site context in Flask g object."""
    # Create a JWT token with user's site ID
    token = create_auth_token(user_with_site.id, [test_site.id])
    
    # Create a Flask context with the auth token
    with app.test_request_context(headers={"Authorization": f"Bearer {token}"}):
        # Trigger the auth middleware by making a request
        client.get(
            "/api/interactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Verify that flask.g contains the expected site_context
        from flask import g
        assert hasattr(g, "site_context")
        assert g.site_context is not None
        
        # Verify that site_context has the correct site ID and available sites
        assert g.site_context["id"] == test_site.id
        assert test_site.id in g.site_context["available_sites"]