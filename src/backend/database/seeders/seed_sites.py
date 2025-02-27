"""
Script to seed the database with initial site data for the Interaction Management System.

Sites represent organizational units that contain users and interactions, providing
boundaries for data access in the multi-tenant application.
"""

import logging

from ...extensions import db
from ..models import Site
from ...utils.logging import logger

# Configure logger
logger = logging.getLogger(__name__)

# Define site data for seeding
SITE_DATA = [
    {
        'name': 'Marketing',
        'description': 'Marketing department site',
        'is_active': True
    },
    {
        'name': 'Sales',
        'description': 'Sales department site',
        'is_active': True
    },
    {
        'name': 'Support',
        'description': 'Customer support department site',
        'is_active': True
    }
]


def get_sites():
    """
    Retrieves all existing sites from the database.
    
    Returns:
        list: List of existing Site objects
    """
    return Site.query.all()


def create_site(name, description, is_active):
    """
    Creates a new site with the specified details.
    
    Args:
        name (str): The name of the site
        description (str): The description of the site
        is_active (bool): Whether the site is active
        
    Returns:
        Site: Created Site object
    """
    site = Site(name=name, description=description, is_active=is_active)
    db.session.add(site)
    return site


def seed_sites():
    """
    Seeds the database with predefined site data for the application.
    
    Returns:
        list: List of Site objects (existing and/or newly created)
    """
    logger.info("Starting site seeding process")
    
    # Check if sites already exist
    existing_sites = get_sites()
    if existing_sites:
        logger.info(f"Sites already exist in database. Found {len(existing_sites)} sites.")
        return existing_sites
    
    # Create sites if none exist
    created_sites = []
    try:
        for site_data in SITE_DATA:
            site = create_site(
                name=site_data['name'],
                description=site_data['description'],
                is_active=site_data['is_active']
            )
            created_sites.append(site)
            logger.info(f"Created site: {site.name}")
        
        # Commit changes to the database
        db.session.commit()
        logger.info(f"Successfully created {len(created_sites)} sites")
        
        # Return the updated list of sites
        return get_sites()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error seeding sites: {str(e)}")
        raise


def run_seeder():
    """
    Entry point function that can be called from other modules to execute the site seeding.
    
    Returns:
        list: List of Site objects
    """
    try:
        return seed_sites()
    except Exception as e:
        logger.error(f"Failed to seed sites: {str(e)}")
        return []


if __name__ == "__main__":
    # Execute seeder if script is run directly
    run_seeder()