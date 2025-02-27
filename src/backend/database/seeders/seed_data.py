"""
Central coordination script for seeding the database with initial data including users, sites, and interactions.
Provides functions to populate the database with sample data in the correct order, ensuring proper relationships.
"""

import logging
import click

from .seed_sites import seed_sites
from .seed_users import seed_users
from .seed_interactions import seed_interactions, clear_interactions
from ...extensions import db

# Configure logger
logger = logging.getLogger(__name__)

# Default number of interactions to seed
DEFAULT_INTERACTION_COUNT = 50


def seed_all(interaction_count=DEFAULT_INTERACTION_COUNT, clear_existing=False):
    """
    Main function to seed all data types in the correct sequence, ensuring proper relationships.
    
    Args:
        interaction_count (int): Number of interactions to create (default: DEFAULT_INTERACTION_COUNT)
        clear_existing (bool): Whether to clear existing data before seeding (default: False)
        
    Returns:
        dict: Summary of created data including counts of each entity type
    """
    logger.info("Starting database seeding process")
    
    # Clear existing data if requested
    if clear_existing:
        logger.info("Clearing existing interaction data")
        clear_interactions()
    
    # Seed sites first
    logger.info("Seeding sites")
    sites = seed_sites()
    
    # Seed users with site mappings
    logger.info("Seeding users")
    users = seed_users()
    
    # Seed interactions with site and user associations
    logger.info(f"Seeding {interaction_count} interactions")
    interactions = seed_interactions(interaction_count)
    
    # Commit the session to ensure all changes are saved
    db.session.commit()
    
    # Create summary
    summary = {
        'sites': len(sites),
        'users': len(users),
        'interactions': len(interactions)
    }
    
    logger.info(f"Seeding complete. Created {summary['sites']} sites, {summary['users']} users, and {summary['interactions']} interactions.")
    
    return summary


def clear_all_data(confirm=False):
    """
    Removes all seeded data from the database in the correct order to maintain referential integrity.
    
    Args:
        confirm (bool): Confirmation flag to prevent accidental data deletion
        
    Returns:
        bool: True if data was cleared, False otherwise
    """
    logger.info("Starting data clearing process")
    
    if not confirm:
        logger.warning("Data deletion requires confirmation. Set confirm=True to proceed.")
        return False
    
    try:
        # Delete interactions first (to maintain referential integrity)
        interaction_count = clear_interactions()
        logger.info(f"Deleted {interaction_count} interactions")
        
        # Delete user-site mappings
        from ...database.models import UserSiteMapping
        user_site_count = db.session.query(UserSiteMapping).delete()
        logger.info(f"Deleted {user_site_count} user-site mappings")
        
        # Delete users
        from ...database.models import User
        user_count = db.session.query(User).delete()
        logger.info(f"Deleted {user_count} users")
        
        # Delete sites last
        from ...database.models import Site
        site_count = db.session.query(Site).delete()
        logger.info(f"Deleted {site_count} sites")
        
        # Commit the changes
        db.session.commit()
        logger.info("All data cleared successfully")
        
        return True
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error clearing data: {str(e)}")
        return False


@click.group()
def cli():
    """Seed data management commands."""
    pass


@cli.command()
@click.option('--interactions', '-i', default=DEFAULT_INTERACTION_COUNT, help='Number of interactions to seed')
@click.option('--clear', '-c', is_flag=True, help='Clear existing data before seeding')
def seed_command(interactions, clear):
    """Seed the database with sample data."""
    result = seed_all(interactions, clear)
    click.echo(f"Seeding complete. Created {result['sites']} sites, {result['users']} users, and {result['interactions']} interactions.")


@cli.command()
@click.option('--yes', '-y', is_flag=True, help='Confirm data deletion')
def clear_command(yes):
    """Clear all data from the database."""
    if not yes:
        confirm = click.confirm('Are you sure you want to delete all data?')
        if not confirm:
            click.echo('Operation cancelled.')
            return
    
    success = clear_all_data(True)
    if success:
        click.echo('All data cleared successfully.')
    else:
        click.echo('Failed to clear data. Check logs for details.')


def main():
    """Main function for direct script execution."""
    cli()


if __name__ == '__main__':
    main()