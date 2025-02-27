"""
Unit tests for the interactions module, covering models, services, repositories, and controllers.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from freezegun import freeze_time

from src.backend.interactions.services import InteractionService
from src.backend.interactions.repositories import InteractionRepository
from src.backend.interactions.schemas import InteractionCreateSchema, InteractionUpdateSchema, InteractionResponseSchema
from src.backend.interactions.controllers import InteractionController
from src.backend.utils.validators import ValidationError
from src.backend.utils.date_utils import date_to_iso

# Test fixtures
@pytest.fixture
def mock_repository():
    """Returns a mock repository for testing services."""
    return Mock(spec=InteractionRepository)

@pytest.fixture
def interaction_service(mock_repository):
    """Returns an interaction service with a mock repository."""
    service = InteractionService()
    service.repository = mock_repository
    return service

@pytest.fixture
def valid_interaction_data():
    """Returns valid interaction data for testing."""
    return {
        'title': 'Test Interaction',
        'type': 'Meeting',
        'lead': 'John Doe',
        'start_datetime': datetime.now(),
        'timezone': 'America/New_York',
        'end_datetime': datetime.now() + timedelta(hours=1),
        'location': 'Conference Room A',
        'description': 'Test description',
        'notes': 'Test notes'
    }

@pytest.fixture
def invalid_interaction_data():
    """Returns invalid interaction data for testing."""
    return {
        'title': '',  # Empty title
        'type': 'Invalid Type',  # Invalid type
        'lead': 'John Doe',
        'start_datetime': datetime.now(),
        'timezone': 'Invalid/Timezone',  # Invalid timezone
    }

# Test functions
def test_create_interaction(interaction_service, mock_repository, valid_interaction_data):
    """Tests creating a new interaction with valid data."""
    # Set up mock repository
    site_id = 1
    user_id = 1
    mock_interaction = Mock(interaction_id=1, **valid_interaction_data)
    mock_repository.create.return_value = mock_interaction
    
    # Call service create method
    result = interaction_service.create(valid_interaction_data, site_id, user_id)
    
    # Assert repository create was called with correct data
    mock_repository.create.assert_called_once_with(valid_interaction_data, site_id, user_id)
    
    # Assert response contains expected data
    assert result.interaction_id == 1
    for key, value in valid_interaction_data.items():
        assert getattr(result, key) == value

def test_create_interaction_with_invalid_data(interaction_service, mock_repository, invalid_interaction_data):
    """Tests validation errors when creating interaction with invalid data."""
    # Set up mock repository
    site_id = 1
    user_id = 1
    
    # Call service create method with invalid data
    with pytest.raises(ValidationError) as excinfo:
        interaction_service.create(invalid_interaction_data, site_id, user_id)
    
    # Assert ValidationError is raised
    assert excinfo.value.errors is not None
    assert len(excinfo.value.errors) > 0
    
    # Assert repository create was not called
    mock_repository.create.assert_not_called()

def test_create_interaction_with_end_before_start(interaction_service, mock_repository, valid_interaction_data):
    """Tests validation errors when end date is before start date."""
    # Set up mock repository
    site_id = 1
    user_id = 1
    
    # Create interaction data with end_datetime before start_datetime
    valid_interaction_data['start_datetime'] = datetime.now()
    valid_interaction_data['end_datetime'] = valid_interaction_data['start_datetime'] - timedelta(hours=1)
    
    # Call service create method
    with pytest.raises(ValidationError) as excinfo:
        interaction_service.create(valid_interaction_data, site_id, user_id)
    
    # Assert ValidationError is raised with appropriate message
    assert 'end_datetime' in excinfo.value.errors
    assert 'after start date' in excinfo.value.errors['end_datetime'].lower()
    
    # Assert repository create was not called
    mock_repository.create.assert_not_called()

def test_update_interaction(interaction_service, mock_repository, valid_interaction_data):
    """Tests updating an existing interaction."""
    # Set up mock repository with existing interaction
    interaction_id = 1
    site_id = 1
    user_id = 1
    allowed_site_ids = [site_id]
    update_data = {'title': 'Updated Title', 'notes': 'Updated notes'}
    
    updated_interaction = Mock(
        interaction_id=interaction_id,
        title='Updated Title',
        notes='Updated notes',
        **{k: v for k, v in valid_interaction_data.items() if k not in update_data}
    )
    mock_repository.update.return_value = updated_interaction
    
    # Call service update method
    result = interaction_service.update(interaction_id, update_data, site_id, user_id)
    
    # Assert repository update was called with correct data
    mock_repository.update.assert_called_once_with(interaction_id, update_data, allowed_site_ids, user_id)
    
    # Assert response contains updated fields
    assert result.title == 'Updated Title'
    assert result.notes == 'Updated notes'

def test_update_nonexistent_interaction(interaction_service, mock_repository):
    """Tests error handling when updating a non-existent interaction."""
    # Set up mock repository to return None (not found)
    interaction_id = 999
    site_id = 1
    user_id = 1
    update_data = {'title': 'Updated Title'}
    
    mock_repository.update.side_effect = ResourceNotFoundError()
    
    # Call service update method with non-existent ID
    with pytest.raises(ResourceNotFoundError):
        interaction_service.update(interaction_id, update_data, site_id, user_id)
    
    # Assert repository update was not called
    mock_repository.update.assert_called_once()

def test_delete_interaction(interaction_service, mock_repository):
    """Tests deleting an existing interaction."""
    # Set up mock repository with existing interaction
    interaction_id = 1
    site_id = 1
    allowed_site_ids = [site_id]
    
    mock_repository.delete.return_value = True
    
    # Call service delete method
    result = interaction_service.delete(interaction_id, site_id)
    
    # Assert repository delete was called with correct ID
    mock_repository.delete.assert_called_once_with(interaction_id, allowed_site_ids)
    
    # Assert success response
    assert result is True

def test_get_interaction_by_id(interaction_service, mock_repository, valid_interaction_data):
    """Tests retrieving an interaction by ID."""
    # Set up mock repository to return test interaction
    interaction_id = 1
    site_id = 1
    allowed_site_ids = [site_id]
    
    mock_interaction = Mock(interaction_id=interaction_id, **valid_interaction_data)
    mock_repository.get_by_id.return_value = mock_interaction
    
    # Call service get_by_id method
    result = interaction_service.get_by_id(interaction_id, site_id)
    
    # Assert repository get_by_id was called with correct ID
    mock_repository.get_by_id.assert_called_once_with(interaction_id, allowed_site_ids)
    
    # Assert returned interaction matches expected data
    assert result == mock_interaction

def test_get_interaction_with_site_context(interaction_service, mock_repository, valid_interaction_data):
    """Tests site-scoped access when retrieving an interaction."""
    # Set up mock repository
    interaction_id = 1
    valid_site_id = 1
    invalid_site_id = 2
    
    # Create test interaction with site_id
    mock_interaction = Mock(interaction_id=interaction_id, site_id=valid_site_id, **valid_interaction_data)
    
    def mock_get_by_id(id, allowed_sites):
        if valid_site_id in allowed_sites:
            return mock_interaction
        raise ResourceNotFoundError()
    
    mock_repository.get_by_id.side_effect = mock_get_by_id
    
    # Call service get_by_id with matching site context
    result = interaction_service.get_by_id(interaction_id, valid_site_id)
    assert result == mock_interaction
    
    # Call service get_by_id with non-matching site context
    with pytest.raises(ResourceNotFoundError):
        interaction_service.get_by_id(interaction_id, invalid_site_id)

def test_list_interactions(interaction_service, mock_repository):
    """Tests listing all interactions."""
    # Set up mock repository to return list of interactions
    site_id = 1
    allowed_site_ids = [site_id]
    
    interactions = [
        {'interaction_id': 1, 'title': 'First Interaction', 'site_id': site_id},
        {'interaction_id': 2, 'title': 'Second Interaction', 'site_id': site_id}
    ]
    
    mock_paginated_result = Mock(
        items=interactions,
        total=2,
        page=1,
        page_size=25
    )
    mock_repository.get_all.return_value = mock_paginated_result
    
    # Call service list method
    result = interaction_service.get_all(site_id)
    
    # Assert repository list was called
    mock_repository.get_all.assert_called_once_with(
        allowed_site_ids,
        page=1,
        page_size=25,
        sort_field='created_at',
        sort_direction='desc'
    )
    
    # Assert returned list matches expected interactions
    assert result.items == interactions
    assert result.total == 2

def test_list_interactions_with_site_context(interaction_service, mock_repository):
    """Tests site-scoped access when listing interactions."""
    # Set up mock repository
    site_id = 1
    allowed_site_ids = [site_id]
    
    interactions = [
        {'interaction_id': 1, 'title': 'First Interaction', 'site_id': site_id},
        {'interaction_id': 2, 'title': 'Second Interaction', 'site_id': site_id}
    ]
    
    mock_paginated_result = Mock(
        items=interactions,
        total=2,
        page=1,
        page_size=25
    )
    mock_repository.get_all.return_value = mock_paginated_result
    
    # Call service list method with site context
    result = interaction_service.get_all(site_id)
    
    # Assert repository list was called with site_id filter
    mock_repository.get_all.assert_called_once_with(
        allowed_site_ids,
        page=1,
        page_size=25,
        sort_field='created_at',
        sort_direction='desc'
    )
    
    # Assert only interactions from specified site are returned
    assert result.items == interactions
    assert all(item['site_id'] == site_id for item in result.items)

def test_search_interactions(interaction_service, mock_repository):
    """Tests searching interactions with various criteria."""
    # Set up mock repository to return search results
    site_id = 1
    allowed_site_ids = [site_id]
    
    # Define search criteria (title, type, lead, date range)
    search_criteria = {
        'title': 'Test',
        'type': 'Meeting',
        'lead': 'John',
        'start_datetime': datetime.now().date(),
        'end_datetime': (datetime.now() + timedelta(days=7)).date()
    }
    
    search_results = [
        {'interaction_id': 1, 'title': 'Test Meeting', 'type': 'Meeting', 'lead': 'John Doe', 'site_id': site_id}
    ]
    
    mock_paginated_result = Mock(
        items=search_results,
        total=1,
        page=1,
        page_size=25
    )
    mock_repository.search.return_value = mock_paginated_result
    
    # Call service search method with criteria
    result = interaction_service.search(site_id, search_criteria)
    
    # Assert repository search was called with correct parameters
    mock_repository.search.assert_called_once_with(
        allowed_site_ids,
        filters=search_criteria,
        page=1,
        page_size=25,
        sort_field='created_at',
        sort_direction='desc'
    )
    
    # Assert returned results match expected interactions
    assert result.items == search_results
    assert result.total == 1

def test_search_interactions_with_site_context(interaction_service, mock_repository):
    """Tests site-scoped access when searching interactions."""
    # Set up mock repository
    site_id = 1
    allowed_site_ids = [site_id]
    
    # Define search criteria
    search_criteria = {'title': 'Test'}
    
    search_results = [
        {'interaction_id': 1, 'title': 'Test Meeting', 'site_id': site_id}
    ]
    
    mock_paginated_result = Mock(
        items=search_results,
        total=1,
        page=1,
        page_size=25
    )
    mock_repository.search.return_value = mock_paginated_result
    
    # Call service search method with criteria and site context
    result = interaction_service.search(site_id, search_criteria)
    
    # Assert repository search includes site_id filter
    mock_repository.search.assert_called_once_with(
        allowed_site_ids,
        filters=search_criteria,
        page=1,
        page_size=25,
        sort_field='created_at',
        sort_direction='desc'
    )
    
    # Assert only interactions from specified site are returned
    assert result.items == search_results
    assert all(item['site_id'] == site_id for item in result.items)

@pytest.mark.freeze_time('2023-08-15T10:00:00Z')
def test_interaction_date_handling(interaction_service, mock_repository):
    """Tests correct handling of dates and timezones in interactions."""
    # Create interaction with specific timezone
    site_id = 1
    user_id = 1
    interaction_data = {
        'title': 'Test Interaction',
        'type': 'Meeting',
        'lead': 'John Doe',
        'start_datetime': datetime(2023, 8, 15, 10, 0, 0),
        'timezone': 'America/New_York',
        'end_datetime': datetime(2023, 8, 15, 11, 0, 0),
        'location': 'Conference Room A'
    }
    
    # Set up mock repository
    mock_interaction = Mock(interaction_id=1, **interaction_data)
    mock_repository.create.return_value = mock_interaction
    
    # Call service create method
    result = interaction_service.create(interaction_data, site_id, user_id)
    
    # Assert dates are correctly formatted with timezone information
    assert result.start_datetime == datetime(2023, 8, 15, 10, 0, 0)
    assert result.end_datetime == datetime(2023, 8, 15, 11, 0, 0)
    assert result.timezone == 'America/New_York'
    
    # Assert repository received correctly formatted dates
    mock_repository.create.assert_called_once_with(interaction_data, site_id, user_id)

def test_interaction_schema_validation():
    """Tests validation rules in InteractionSchema."""
    # Create test cases with valid and invalid data
    valid_data = {
        'title': 'Test Interaction',
        'type': 'Meeting',
        'lead': 'John Doe',
        'start_datetime': datetime(2023, 8, 15, 10, 0, 0),
        'timezone': 'America/New_York',
        'end_datetime': datetime(2023, 8, 15, 11, 0, 0),
        'location': 'Conference Room A',
        'description': 'Test description',
        'notes': 'Test notes'
    }
    
    # Instantiate InteractionSchema
    create_schema = InteractionCreateSchema()
    
    # Test valid data passes validation
    try:
        create_schema.validate(valid_data)
    except ValidationError:
        pytest.fail("Valid data failed validation")
    
    # Test various invalid data cases (missing fields, invalid types)
    with pytest.raises(ValidationError):
        create_schema.validate({'title': 'Missing Required Fields'})
        
    with pytest.raises(ValidationError):
        create_schema.validate({**valid_data, 'type': 'InvalidType'})
        
    with pytest.raises(ValidationError):
        create_schema.validate({**valid_data, 'timezone': 'Invalid/Timezone'})
        
    with pytest.raises(ValidationError):
        create_schema.validate({
            **valid_data,
            'start_datetime': datetime(2023, 8, 15, 11, 0, 0),
            'end_datetime': datetime(2023, 8, 15, 10, 0, 0)  # End before start
        })
    
    # Assert appropriate validation errors are raised
    try:
        create_schema.validate({'title': 'Missing Required Fields'})
    except ValidationError as e:
        assert 'type' in e.errors
        assert 'lead' in e.errors
        assert 'start_datetime' in e.errors
        assert 'timezone' in e.errors

@patch('src.backend.interactions.controllers.create_schema')
@patch('src.backend.interactions.controllers.interaction_service')
@patch('src.backend.interactions.controllers.jsonify')
def test_interaction_controller_create(mock_jsonify, mock_service, mock_schema):
    """Tests controller layer for creating interactions."""
    # Mock interaction service
    mock_interaction = Mock(
        interaction_id=1,
        title='Test Interaction',
        type='Meeting',
        site_id=1
    )
    mock_service.create.return_value = mock_interaction
    
    # Create test request data
    with patch('src.backend.interactions.controllers.request') as mock_request, \
         patch('src.backend.interactions.controllers.g') as mock_g:
        mock_request.get_json.return_value = {
            'title': 'Test Interaction',
            'type': 'Meeting',
            'lead': 'John Doe'
        }
        mock_request.headers.get.return_value = 'test-request-id'
        mock_g.site_context = 1
        mock_g.user = 1
        
        mock_schema.load.return_value = {
            'title': 'Test Interaction',
            'type': 'Meeting',
            'lead': 'John Doe'
        }
        
        # Call controller create method
        from src.backend.interactions.controllers import create_interaction
        create_interaction()
        
        # Assert service create was called with correct data
        mock_service.create.assert_called_once_with(
            mock_schema.load.return_value,
            mock_g.site_context,
            mock_g.user
        )
        
        # Assert controller returns expected response
        mock_jsonify.assert_called_once()

@patch('src.backend.interactions.controllers.response_schema')
@patch('src.backend.interactions.controllers.interaction_service')
@patch('src.backend.interactions.controllers.jsonify')
def test_interaction_controller_get(mock_jsonify, mock_service, mock_schema):
    """Tests controller layer for retrieving an interaction."""
    # Mock interaction service to return test interaction
    mock_interaction = Mock(
        interaction_id=1,
        title='Test Interaction',
        type='Meeting',
        site_id=1
    )
    mock_service.get_by_id.return_value = mock_interaction
    
    # Mock response schema
    mock_schema.dump.return_value = {
        'id': 1,
        'title': 'Test Interaction',
        'type': 'Meeting'
    }
    
    # Call controller get method
    with patch('src.backend.interactions.controllers.g') as mock_g:
        mock_g.site_context = 1
        
        from src.backend.interactions.controllers import get_interaction
        get_interaction(1)
        
        # Assert service get_by_id was called with correct ID
        mock_service.get_by_id.assert_called_once_with(1, mock_g.site_context)
        
        # Assert controller returns expected response
        mock_jsonify.assert_called_once()

@patch('src.backend.interactions.controllers.format_error_response')
@patch('src.backend.interactions.controllers.interaction_service')
@patch('src.backend.interactions.controllers.jsonify')
def test_interaction_controller_error_handling(mock_jsonify, mock_service, mock_error_formatter):
    """Tests controller error handling for various exceptions."""
    # Mock interaction service to raise different exceptions
    validation_error = ValidationError("Validation failed", {"title": "Title is required"})
    mock_service.create.side_effect = validation_error
    
    # Mock format_error_response
    mock_error_formatter.return_value = {"error": {"code": "VALIDATION_ERROR"}}
    mock_jsonify.return_value = MagicMock()
    
    # Call controller methods and catch responses
    with patch('src.backend.interactions.controllers.request') as mock_request, \
         patch('src.backend.interactions.controllers.g') as mock_g:
        mock_request.get_json.return_value = {}
        mock_request.headers.get.return_value = 'test-request-id'
        mock_g.site_context = 1
        mock_g.user = 1
        
        # Test ValidationError
        from src.backend.interactions.controllers import create_interaction
        create_interaction()
        
        # Assert ValidationError produces 400 response
        mock_error_formatter.assert_called_with(
            code="VALIDATION_ERROR",
            message="Validation failed",
            request_id='test-request-id',
            details=[{"field": "title", "message": "Title is required"}]
        )
        mock_jsonify.assert_called_with(mock_error_formatter.return_value)
        
        # Test NotFound
        from src.backend.api.error_handlers import ResourceNotFoundError
        not_found_error = ResourceNotFoundError()
        mock_service.get_by_id.side_effect = not_found_error
        mock_error_formatter.return_value = {"error": {"code": "NOT_FOUND"}}
        
        from src.backend.interactions.controllers import get_interaction
        get_interaction(1)
        
        # Assert NotFound produces 404 response
        mock_error_formatter.assert_called_with(
            code="NOT_FOUND",
            message="Interaction with id 1 not found",
            request_id='test-request-id'
        )
        
        # Test other exceptions
        mock_service.get_by_id.side_effect = Exception("Unexpected error")
        mock_error_formatter.return_value = {"error": {"code": "INTERNAL_SERVER_ERROR"}}
        
        get_interaction(1)
        
        # Assert other exceptions produce 500 response
        mock_error_formatter.assert_called_with(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while retrieving the interaction",
            request_id='test-request-id'
        )