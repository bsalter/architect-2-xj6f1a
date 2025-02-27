"""
Pytest configuration file that defines fixtures for the Interaction Management System testing suite.
Provides test database setup, authentication fixtures, site context fixtures, and test data for both
unit and integration tests.
"""

import pytest
import tempfile
from datetime import datetime

from src.backend.app import create_app
from src.backend.extensions import db
from src.backend.auth.models import User, UserSiteMapping as UserSite
from src.backend.sites.models import Site
from src.backend.interactions.models import Interaction
from src.backend.auth.utils import create_auth_token
from src.backend.tests.factories import UserFactory, SiteFactory, InteractionFactory

# Constant for test passwords
TEST_PASSWORD = 'password123'

def pytest_configure(config):
    """
    Pytest hook to configure the test environment.
    
    Args:
        config: Pytest configuration object
    """
    # Register custom markers
    config.addinivalue_line("markers", "unit: mark as unit test")
    config.addinivalue_line("markers", "integration: mark as integration test")
    config.addinivalue_line("markers", "authentication: mark as authentication test")
    config.addinivalue_line("markers", "interactions: mark as interactions test")
    config.addinivalue_line("markers", "site_scoping: mark as site-scoping test")


@pytest.fixture(scope='session')
def app():
    """
    Fixture that creates a Flask application configured for testing.
    
    Returns:
        Flask application instance
    """
    # Create test configuration
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'JWT_SECRET_KEY': 'test-jwt-secret-key',
        'SITE_SCOPING_ENABLED': True
    }
    
    # Create Flask app with test configuration
    app = create_app(test_config)
    
    return app


@pytest.fixture
def client(app):
    """
    Fixture that provides a Flask test client.
    
    Args:
        app: Flask application fixture
    
    Returns:
        Flask test client
    """
    with app.test_client() as client:
        client.testing = True
        return client


@pytest.fixture
def db_session(app):
    """
    Fixture that provides a clean database session for each test.
    
    Args:
        app: Flask application fixture
    
    Returns:
        SQLAlchemy session
    """
    with app.app_context():
        # Create all tables
        db.drop_all()
        db.create_all()
        
        # Provide session to test
        yield db.session
        
        # Clean up after test
        db.session.rollback()
        db.session.remove()
        db.drop_all()


@pytest.fixture
def test_user(db_session):
    """
    Fixture that creates a regular test user.
    
    Args:
        db_session: Database session fixture
    
    Returns:
        User model instance
    """
    user = UserFactory(
        username="testuser",
        email="testuser@example.com",
        password_hash=TEST_PASSWORD,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def admin_user(db_session):
    """
    Fixture that creates an admin test user.
    
    Args:
        db_session: Database session fixture
    
    Returns:
        Admin User model instance
    """
    user = UserFactory(
        username="adminuser",
        email="admin@example.com",
        password_hash=TEST_PASSWORD,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def viewer_user(db_session):
    """
    Fixture that creates a viewer test user with read-only permissions.
    
    Args:
        db_session: Database session fixture
    
    Returns:
        Viewer User model instance
    """
    user = UserFactory(
        username="vieweruser",
        email="viewer@example.com",
        password_hash=TEST_PASSWORD,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_site(db_session):
    """
    Fixture that creates a test site.
    
    Args:
        db_session: Database session fixture
    
    Returns:
        Site model instance
    """
    site = SiteFactory(
        name="Test Site",
        description="A test site for unit testing",
        is_active=True
    )
    db_session.add(site)
    db_session.commit()
    return site


@pytest.fixture
def secondary_site(db_session):
    """
    Fixture that creates a second test site for multi-site testing.
    
    Args:
        db_session: Database session fixture
    
    Returns:
        Site model instance
    """
    site = SiteFactory(
        name="Secondary Test Site",
        description="A second test site for multi-site testing",
        is_active=True
    )
    db_session.add(site)
    db_session.commit()
    return site


@pytest.fixture
def user_with_site(db_session, test_user, test_site):
    """
    Fixture that associates a user with a site.
    
    Args:
        db_session: Database session fixture
        test_user: User model instance
        test_site: Site model instance
    
    Returns:
        User model instance with site association
    """
    user_site = UserSite(
        user_id=test_user.id,
        site_id=test_site.site_id,
        role="Editor"
    )
    db_session.add(user_site)
    db_session.commit()
    return test_user


@pytest.fixture
def user_with_multiple_sites(db_session, test_user, test_site, secondary_site):
    """
    Fixture that associates a user with multiple sites.
    
    Args:
        db_session: Database session fixture
        test_user: User model instance
        test_site: Primary site model instance
        secondary_site: Secondary site model instance
    
    Returns:
        User model instance with multiple site associations
    """
    # Create association with first site
    user_site1 = UserSite(
        user_id=test_user.id,
        site_id=test_site.site_id,
        role="Editor"
    )
    
    # Create association with second site
    user_site2 = UserSite(
        user_id=test_user.id,
        site_id=secondary_site.site_id,
        role="Editor"
    )
    
    db_session.add(user_site1)
    db_session.add(user_site2)
    db_session.commit()
    return test_user


@pytest.fixture
def test_interaction(db_session, test_site, test_user):
    """
    Fixture that creates a test interaction.
    
    Args:
        db_session: Database session fixture
        test_site: Site model instance
        test_user: User model instance
    
    Returns:
        Interaction model instance
    """
    interaction = InteractionFactory(
        site=test_site,
        title="Test Interaction",
        type="Meeting",
        lead="Test Lead",
        start_datetime=datetime.now(),
        timezone="America/New_York",
        end_datetime=datetime.now(),
        location="Test Location",
        description="Test Description",
        notes="Test Notes",
        created_by=test_user,
        updated_by=test_user
    )
    db_session.add(interaction)
    db_session.commit()
    return interaction


@pytest.fixture
def multiple_interactions(db_session, test_site, test_user):
    """
    Fixture that creates multiple test interactions for pagination and search testing.
    
    Args:
        db_session: Database session fixture
        test_site: Site model instance
        test_user: User model instance
    
    Returns:
        List of Interaction model instances
    """
    interactions = []
    
    # Create multiple interactions with varying properties for search testing
    interaction_types = ["Meeting", "Call", "Email", "Update", "Training"]
    
    for i in range(10):
        interaction = InteractionFactory(
            site=test_site,
            title=f"Test Interaction {i}",
            type=interaction_types[i % 5],
            lead=f"Lead Person {i}",
            start_datetime=datetime.now(),
            timezone="America/New_York",
            end_datetime=datetime.now(),
            location=f"Location {i}",
            description=f"Description for interaction {i}",
            notes=f"Notes for interaction {i}",
            created_by=test_user,
            updated_by=test_user
        )
        db_session.add(interaction)
        interactions.append(interaction)
    
    db_session.commit()
    return interactions


@pytest.fixture
def site_interactions(db_session, site, user):
    """
    Fixture that creates interactions for a specific site.
    
    Args:
        db_session: Database session fixture
        site: Site model instance
        user: User model instance
    
    Returns:
        List of Interaction model instances for the site
    """
    interactions = []
    
    # Create site-specific interactions
    interaction_types = ["Meeting", "Call", "Email"]
    
    for i in range(5):
        interaction = InteractionFactory(
            site=site,
            title=f"Site-specific Interaction {i}",
            type=interaction_types[i % 3],
            lead=f"Site Lead {i}",
            start_datetime=datetime.now(),
            timezone="America/New_York",
            end_datetime=datetime.now(),
            location=f"Site Location {i}",
            description=f"Description for site interaction {i}",
            notes=f"Notes for site interaction {i}",
            created_by=user,
            updated_by=user
        )
        db_session.add(interaction)
        interactions.append(interaction)
    
    db_session.commit()
    return interactions


@pytest.fixture
def auth_token(user_with_site):
    """
    Fixture that generates an authentication token for a user.
    
    Args:
        user_with_site: User with site association
    
    Returns:
        JWT token string
    """
    # Get user's site IDs
    site_ids = [site.site_id for site in user_with_site.sites]
    
    # Create JWT token with user ID and site IDs
    token = create_auth_token(user_with_site.id, site_ids)
    return token


@pytest.fixture
def auth_headers(auth_token):
    """
    Fixture that provides authentication headers with token.
    
    Args:
        auth_token: JWT token string
    
    Returns:
        HTTP headers dictionary with Authorization
    """
    return {
        'Authorization': f'Bearer {auth_token}',
        'Content-Type': 'application/json'
    }