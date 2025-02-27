"""
Unit tests for the Sites module, covering site model validation, repository operations,
service methods, and controller functionality.
"""

import pytest
from unittest.mock import patch, MagicMock

from src.backend.extensions import db
from src.backend.sites.models import Site
from src.backend.sites.repositories import SiteRepository
from src.backend.sites.services import SiteService
from src.backend.tests.factories import SiteFactory, UserFactory, UserSiteFactory
from src.backend.api.error_handlers import ResourceNotFoundError, ValidationError


def test_site_model_creation():
    """Test creating a Site model instance with valid data."""
    # Create a site instance with valid data (name, description)
    site = Site(name="Test Site", description="This is a test site")
    
    # Assert the site attributes match the input data
    assert site.name == "Test Site"
    assert site.description == "This is a test site"
    # Assert the site is_active is True by default
    assert site.is_active is True


def test_site_model_str_representation():
    """Test the string representation of a Site model."""
    # Create a site instance with a known name
    site = Site(name="Test Site")
    
    # Assert that str(site) contains the site name
    assert "Test Site" in str(site)


def test_site_repository_get_all_sites(db_session):
    """Test SiteRepository.get_all_sites method."""
    # Create multiple test sites using SiteFactory
    sites = [SiteFactory() for _ in range(3)]
    db_session.commit()
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.get_all_sites()
    result = repository.get_all_sites()
    
    # Assert the returned PaginatedResult contains all created sites
    assert result.total >= len(sites)
    assert all(site in result.items for site in sites)


def test_site_repository_get_site_by_id(db_session):
    """Test SiteRepository.get_site_by_id method."""
    # Create a test site using SiteFactory
    site = SiteFactory()
    db_session.commit()
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.get_site_by_id(site.site_id)
    result = repository.get_site_by_id(site.site_id)
    
    # Assert the returned site matches the created site
    assert result == site
    assert result.site_id == site.site_id
    assert result.name == site.name


def test_site_repository_get_site_by_id_not_found(db_session):
    """Test SiteRepository.get_site_by_id method with non-existent ID."""
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.get_site_by_id with a non-existent ID (e.g., 9999)
    result = repository.get_site_by_id(9999)
    
    # Assert that the method returns None
    assert result is None


def test_site_repository_get_site_by_name(db_session):
    """Test SiteRepository.get_site_by_name method."""
    # Create a test site with a unique name using SiteFactory
    site = SiteFactory(name="Unique Test Site")
    db_session.commit()
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.get_site_by_name(site.name)
    result = repository.get_site_by_name(site.name)
    
    # Assert the returned site matches the created site
    assert result == site
    assert result.site_id == site.site_id
    assert result.name == site.name


def test_site_repository_create_site(db_session):
    """Test SiteRepository.create_site method."""
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Prepare site data dictionary with name and description
    site_data = {
        "name": "New Test Site",
        "description": "This is a new test site"
    }
    
    # Call repository.create_site(site_data)
    site = repository.create_site(site_data)
    
    # Assert that the returned site has the expected attributes
    assert site.name == site_data["name"]
    assert site.description == site_data["description"]
    assert site.is_active is True
    
    # Assert that the site exists in the database by querying it
    queried_site = db_session.query(Site).filter_by(site_id=site.site_id).first()
    assert queried_site is not None
    assert queried_site.name == site_data["name"]


def test_site_repository_update_site(db_session):
    """Test SiteRepository.update_site method."""
    # Create a test site using SiteFactory
    site = SiteFactory()
    db_session.commit()
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Prepare updated site data with new name and description
    updated_data = {
        "name": "Updated Site Name",
        "description": "Updated description"
    }
    
    # Call repository.update_site(site.site_id, updated_data)
    updated_site = repository.update_site(site.site_id, updated_data)
    
    # Assert that the returned site has the updated attributes
    assert updated_site.name == updated_data["name"]
    assert updated_site.description == updated_data["description"]
    
    # Verify the updates persisted by querying the database
    db_session.refresh(site)
    assert site.name == updated_data["name"]
    assert site.description == updated_data["description"]


def test_site_repository_delete_site(db_session):
    """Test SiteRepository.delete_site method with hard delete."""
    # Create a test site using SiteFactory
    site = SiteFactory()
    db_session.commit()
    site_id = site.site_id
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.delete_site(site.site_id, hard_delete=True)
    result = repository.delete_site(site_id, hard_delete=True)
    
    # Assert that the method returns True
    assert result is True
    
    # Query the database and assert the site no longer exists
    deleted_site = db_session.query(Site).filter_by(site_id=site_id).first()
    assert deleted_site is None


def test_site_repository_soft_delete_site(db_session):
    """Test SiteRepository.delete_site method with soft delete."""
    # Create a test site using SiteFactory
    site = SiteFactory()
    db_session.commit()
    site_id = site.site_id
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.delete_site(site.site_id, hard_delete=False)
    result = repository.delete_site(site_id, hard_delete=False)
    
    # Assert that the method returns True
    assert result is True
    
    # Query the database and assert the site still exists but is_active is False
    soft_deleted_site = db_session.query(Site).filter_by(site_id=site_id).first()
    assert soft_deleted_site is not None
    assert soft_deleted_site.is_active is False


def test_site_repository_user_has_site_access(db_session):
    """Test SiteRepository.user_has_site_access method."""
    # Create a test user using UserFactory
    user = UserFactory()
    
    # Create a test site using SiteFactory
    site = SiteFactory()
    db_session.commit()
    
    # Create a user-site association using UserSiteFactory
    user_site = UserSiteFactory(user=user, site=site)
    db_session.commit()
    
    # Create SiteRepository instance
    repository = SiteRepository()
    
    # Call repository.user_has_site_access(user.id, site.site_id)
    result = repository.user_has_site_access(user.id, site.site_id)
    
    # Assert that the method returns True
    assert result is True
    
    # Call repository.user_has_site_access with non-associated site
    non_associated_site = SiteFactory()
    db_session.commit()
    non_associated_result = repository.user_has_site_access(user.id, non_associated_site.site_id)
    
    # Assert that the method returns False
    assert non_associated_result is False


@patch('src.backend.sites.repositories.SiteRepository.get_all_sites')
def test_site_service_get_sites(mock_get_all_sites):
    """Test SiteService.get_sites method."""
    # Create a mock for the repository's get_all_sites method
    mock_result = MagicMock()
    mock_result.items = [MagicMock()]
    mock_result.total = 1
    mock_get_all_sites.return_value = mock_result
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Call service.get_sites() with pagination parameters
    pagination_params = {"page": 2, "page_size": 10}
    result = service.get_sites(pagination_params, active_only=True)
    
    # Assert that repository.get_all_sites was called with the correct parameters
    mock_get_all_sites.assert_called_once_with(pagination_params, True)
    
    # Assert that the service returns the expected paginated result
    assert result == mock_result


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_id')
def test_site_service_get_site_by_id(mock_get_site_by_id):
    """Test SiteService.get_site_by_id method."""
    # Create a mock for the repository's get_site_by_id method
    mock_site = MagicMock()
    mock_get_site_by_id.return_value = mock_site
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Call service.get_site_by_id(1)
    result = service.get_site_by_id(1)
    
    # Assert that repository.get_site_by_id was called with the correct site_id
    mock_get_site_by_id.assert_called_once_with(1)
    
    # Assert that the service returns the expected site
    assert result == mock_site


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_id')
def test_site_service_get_site_by_id_not_found(mock_get_site_by_id):
    """Test SiteService.get_site_by_id method when site doesn't exist."""
    # Create a mock for the repository's get_site_by_id method
    mock_get_site_by_id.return_value = None
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Call service.get_site_by_id(999)
    result = service.get_site_by_id(999)
    
    # Assert that repository.get_site_by_id was called with the correct site_id
    mock_get_site_by_id.assert_called_once_with(999)
    
    # Assert that the service returns None
    assert result is None


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_name')
@patch('src.backend.sites.repositories.SiteRepository.create_site')
def test_site_service_create_site(mock_create_site, mock_get_site_by_name):
    """Test SiteService.create_site method."""
    # Create mocks for repository methods
    mock_get_site_by_name.return_value = None  # No existing site with same name
    mock_site = MagicMock()
    mock_create_site.return_value = mock_site
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Prepare site data dictionary
    site_data = {
        "name": "New Site",
        "description": "New site description"
    }
    
    # Call service.create_site(site_data)
    result = service.create_site(site_data)
    
    # Assert repository.get_site_by_name was called with the correct name
    mock_get_site_by_name.assert_called_once_with(site_data["name"])
    
    # Assert repository.create_site was called with the correct data
    mock_create_site.assert_called_once_with(site_data)
    
    # Assert the service returns the expected site
    assert result == mock_site


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_name')
def test_site_service_create_site_name_conflict(mock_get_site_by_name):
    """Test SiteService.create_site method with an existing site name."""
    # Create a mock for repository.get_site_by_name
    mock_site = MagicMock()
    mock_get_site_by_name.return_value = mock_site  # Indicating name conflict
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Prepare site data dictionary
    site_data = {
        "name": "Existing Site",
        "description": "This site name already exists"
    }
    
    # Assert that calling service.create_site(site_data) raises ValueError with appropriate message
    with pytest.raises(ValueError) as excinfo:
        service.create_site(site_data)
    
    assert "already exists" in str(excinfo.value)
    mock_get_site_by_name.assert_called_once_with(site_data["name"])


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_id')
@patch('src.backend.sites.repositories.SiteRepository.get_site_by_name')
@patch('src.backend.sites.repositories.SiteRepository.update_site')
def test_site_service_update_site(mock_update_site, mock_get_site_by_name, mock_get_site_by_id):
    """Test SiteService.update_site method."""
    # Create mocks for repository methods
    mock_site = MagicMock()
    mock_site.name = "Original Site Name"
    mock_get_site_by_id.return_value = mock_site  # Site exists
    mock_get_site_by_name.return_value = None  # No name conflict
    mock_updated_site = MagicMock()
    mock_update_site.return_value = mock_updated_site
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Prepare updated site data
    updated_data = {
        "name": "Updated Site Name",
        "description": "Updated description"
    }
    
    # Call service.update_site(1, updated_data)
    result = service.update_site(1, updated_data)
    
    # Assert repository methods were called with correct parameters
    mock_get_site_by_id.assert_called_once_with(1)
    mock_get_site_by_name.assert_called_once_with(updated_data["name"])
    mock_update_site.assert_called_once_with(1, updated_data)
    
    # Assert the service returns the expected updated site
    assert result == mock_updated_site


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_id')
def test_site_service_update_site_not_found(mock_get_site_by_id):
    """Test SiteService.update_site method when site doesn't exist."""
    # Create a mock for repository.get_site_by_id
    mock_get_site_by_id.return_value = None  # Site not found
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Prepare updated site data
    updated_data = {
        "name": "Updated Site Name",
        "description": "Updated description"
    }
    
    # Call service.update_site(999, updated_data)
    result = service.update_site(999, updated_data)
    
    # Assert repository.get_site_by_id was called with the correct site_id
    mock_get_site_by_id.assert_called_once_with(999)
    
    # Assert the service returns None
    assert result is None


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_id')
@patch('src.backend.sites.repositories.SiteRepository.delete_site')
def test_site_service_delete_site(mock_delete_site, mock_get_site_by_id):
    """Test SiteService.delete_site method."""
    # Create mocks for repository methods
    mock_site = MagicMock()
    mock_site.name = "Site to Delete"
    mock_get_site_by_id.return_value = mock_site  # Site exists
    mock_delete_site.return_value = True
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Call service.delete_site(1, hard_delete=False)
    result = service.delete_site(1, hard_delete=False)
    
    # Assert repository methods were called with correct parameters
    mock_get_site_by_id.assert_called_once_with(1)
    mock_delete_site.assert_called_once_with(1, False)
    
    # Assert the service returns True
    assert result is True


@patch('src.backend.sites.repositories.SiteRepository.get_site_by_id')
def test_site_service_delete_site_not_found(mock_get_site_by_id):
    """Test SiteService.delete_site method when site doesn't exist."""
    # Create a mock for repository.get_site_by_id
    mock_get_site_by_id.return_value = None  # Site not found
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Call service.delete_site(999)
    result = service.delete_site(999)
    
    # Assert repository.get_site_by_id was called with the correct site_id
    mock_get_site_by_id.assert_called_once_with(999)
    
    # Assert the service returns False
    assert result is False


@patch('src.backend.sites.repositories.SiteRepository.user_has_site_access')
def test_site_service_verify_user_site_access(mock_user_has_site_access):
    """Test SiteService.verify_user_site_access method."""
    # Create a mock for repository.user_has_site_access
    mock_user_has_site_access.return_value = True
    
    # Create SiteService instance with the mocked repository
    service = SiteService()
    
    # Call service.verify_user_site_access(1, 1)
    result = service.verify_user_site_access(1, 1)
    
    # Assert repository.user_has_site_access was called with correct user_id and site_id
    mock_user_has_site_access.assert_called_once_with(1, 1)
    
    # Assert the service returns True
    assert result is True