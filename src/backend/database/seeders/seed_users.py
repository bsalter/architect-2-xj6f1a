"""
Script for seeding user data into the database. Creates predefined users with different roles and site
associations for development, testing, and demonstration environments.
"""

import logging
from datetime import datetime

from ...database.models import User, UserSiteMapping
from ...extensions import db
from ...utils.security import hash_password
from .seed_sites import seed_sites

# Configure logger
logger = logging.getLogger(__name__)

# Define user data for seeding
SEED_USERS = [
    {
        'username': 'admin',
        'email': 'admin@example.com',
        'password': 'Admin123!',
        'is_active': True,
        'sites': [
            {'site_name': 'Marketing', 'role': 'Administrator'},
            {'site_name': 'Sales', 'role': 'Administrator'},
            {'site_name': 'Support', 'role': 'Administrator'}
        ]
    },
    {
        'username': 'marketing_user',
        'email': 'marketing@example.com',
        'password': 'Marketing123!',
        'is_active': True,
        'sites': [
            {'site_name': 'Marketing', 'role': 'Editor'}
        ]
    },
    {
        'username': 'sales_user',
        'email': 'sales@example.com',
        'password': 'Sales123!',
        'is_active': True,
        'sites': [
            {'site_name': 'Sales', 'role': 'Editor'}
        ]
    },
    {
        'username': 'support_user',
        'email': 'support@example.com',
        'password': 'Support123!',
        'is_active': True,
        'sites': [
            {'site_name': 'Support', 'role': 'Editor'}
        ]
    },
    {
        'username': 'viewer',
        'email': 'viewer@example.com',
        'password': 'Viewer123!',
        'is_active': True,
        'sites': [
            {'site_name': 'Marketing', 'role': 'Viewer'},
            {'site_name': 'Sales', 'role': 'Viewer'},
            {'site_name': 'Support', 'role': 'Viewer'}
        ]
    },
    {
        'username': 'inactive_user',
        'email': 'inactive@example.com',
        'password': 'Inactive123!',
        'is_active': False,
        'sites': []
    }
]


def create_user(username, email, password, is_active):
    """
    Creates a new user with the specified details.
    
    Args:
        username (str): The username for the user
        email (str): The email address for the user
        password (str): The plain text password (will be hashed)
        is_active (bool): Whether the user account is active
        
    Returns:
        User: Created user object
    """
    # Hash the password for secure storage
    hashed_password = hash_password(password)
    
    # Create user object
    user = User(
        username=username,
        email=email,
        password_hash=hashed_password,
        is_active=is_active,
        last_login=datetime.utcnow()
    )
    
    # Add to session (but don't commit yet)
    db.session.add(user)
    
    return user


def associate_user_with_site(user, site, role):
    """
    Associates a user with a site and assigns a role.
    
    Args:
        user (User): The user to associate
        site (Site): The site to associate with
        role (str): The role to assign to the user for this site
        
    Returns:
        UserSiteMapping: Created UserSiteMapping object
    """
    # Create the association
    mapping = UserSiteMapping(
        user_id=user.user_id,
        site_id=site.site_id,
        role=role,
        assigned_at=datetime.utcnow()
    )
    
    # Add to session (but don't commit yet)
    db.session.add(mapping)
    
    return mapping


def get_site_by_name(name, sites):
    """
    Retrieves a site by its name.
    
    Args:
        name (str): The name of the site to find
        sites (list): List of Site objects to search in
        
    Returns:
        Site or None: Site object if found, None otherwise
    """
    for site in sites:
        if site.name == name:
            return site
    return None


def seed_users():
    """
    Creates predefined users for development and testing environments.
    
    Returns:
        list: List of created user objects
    """
    logger.info("Starting user seeding process")
    
    # Make sure sites exist
    sites = seed_sites()
    
    created_users = []
    
    try:
        # Create each predefined user
        for user_data in SEED_USERS:
            # Create the user
            user = create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                is_active=user_data['is_active']
            )
            logger.info(f"Created user: {user.username}")
            
            # Associate with sites
            for site_info in user_data['sites']:
                site = get_site_by_name(site_info['site_name'], sites)
                if site:
                    mapping = associate_user_with_site(
                        user=user,
                        site=site,
                        role=site_info['role']
                    )
                    logger.info(f"Associated user {user.username} with site {site.name} as {site_info['role']}")
                else:
                    logger.warning(f"Site {site_info['site_name']} not found for user {user.username}")
            
            created_users.append(user)
        
        # Commit all changes
        db.session.commit()
        logger.info(f"Successfully created {len(created_users)} users")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error seeding users: {str(e)}")
        raise
    
    return created_users


if __name__ == "__main__":
    # Execute seeder if script is run directly
    seed_users()