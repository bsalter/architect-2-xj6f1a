"""
Script for seeding interaction data into the database. Generates a configurable number of realistic
interaction records for development, testing, and demonstration purposes, with proper site associations.
"""

import logging
import random
from datetime import datetime, timedelta

import pytz  # version 2023.3
from faker import Faker  # version 18.9.0

from ...extensions import db
from ...database.models import Interaction, Site, User
from ...utils.date_utils import get_current_datetime, convert_timezone, DEFAULT_TIMEZONE
from .seed_users import seed_users
from .seed_sites import seed_sites

# Configure logger
logger = logging.getLogger(__name__)

# Initialize Faker for generating realistic data
faker = Faker()

# Define interaction types
INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Training', 'Presentation', 'Workshop', 'Conference', 'Review', 'Interview', 'Other']

# Default number of interactions to seed
DEFAULT_COUNT = 25

# Define possible locations
LOCATIONS = ['Conference Room A', 'Conference Room B', 'Meeting Room 1', 'Meeting Room 2', 'Virtual', 'Phone', 'Client Office', 'Main Office', 'Training Room', 'Off-site']


def clear_interactions():
    """
    Removes all interaction records from the database.

    Returns:
        int: Number of deleted interactions
    """
    logger.info("Starting interaction cleanup")
    total_interactions = Interaction.query.count()
    db.session.query(Interaction).delete()
    db.session.commit()
    logger.info("Interaction cleanup complete")
    return total_interactions


def get_random_user_from_site(site: Site):
    """
    Gets a random user that belongs to the specified site

    Args:
        site (Site): site

    Returns:
        User or None: A random user from the site or None if no users found
    """
    users = site.users
    if users:
        return random.choice(list(users))
    return None


def generate_interaction_dates():
    """
    Generates random start and end datetime for an interaction within a reasonable range

    Returns:
        tuple: (start_datetime, end_datetime) in UTC
    """
    # Generate a random date between 30 days ago and 30 days in future
    start_date = faker.date_between(start_date='-30d', end_date='+30d')

    # Generate a random start time
    start_time = faker.time()

    # Create a start_datetime by combining the date and time
    start_datetime = datetime.combine(datetime.strptime(start_date, '%Y-%m-%d').date(),
                                      datetime.strptime(start_time, '%H:%M:%S').time())

    # Generate a random duration between 30 minutes and 3 hours
    duration = timedelta(minutes=random.randint(30, 180))

    # Calculate end_datetime by adding duration to start_datetime
    end_datetime = start_datetime + duration

    return start_datetime, end_datetime


def create_interaction(site: Site, creator: User, data=None):
    """
    Creates a single interaction record with provided or generated data

    Args:
        site (Site): site
        creator (User): creator
        data (dict, optional): data. Defaults to None.

    Returns:
        Interaction: Created interaction object
    """
    if data is None:
        title = faker.sentence(nb_words=5)
        interaction_type = random.choice(INTERACTION_TYPES)
        lead = faker.name()
        location = random.choice(LOCATIONS)
        description = faker.paragraph(nb_sentences=3)
        notes = faker.text()
        start_datetime, end_datetime = generate_interaction_dates()
        timezone = DEFAULT_TIMEZONE
    else:
        title = data.get('title', faker.sentence(nb_words=5))
        interaction_type = data.get('type', random.choice(INTERACTION_TYPES))
        lead = data.get('lead', faker.name())
        location = data.get('location', random.choice(LOCATIONS))
        description = data.get('description', faker.paragraph(nb_sentences=3))
        notes = data.get('notes', faker.text())
        start_datetime = data.get('start_datetime')
        end_datetime = data.get('end_datetime')
        timezone = data.get('timezone', DEFAULT_TIMEZONE)

        if not start_datetime or not end_datetime:
            start_datetime, end_datetime = generate_interaction_dates()

    interaction = Interaction(
        site_id=site.site_id,
        title=title,
        type=interaction_type,
        lead=lead,
        start_datetime=start_datetime,
        timezone=timezone,
        end_datetime=end_datetime,
        location=location,
        description=description,
        notes=notes,
        created_by=creator.user_id,
        created_at=get_current_datetime(),
        updated_by=creator.user_id,
        updated_at=get_current_datetime()
    )
    db.session.add(interaction)
    return interaction


def seed_interactions(count=DEFAULT_COUNT, clear_existing=False):
    """
    Seeds the database with a specified number of interaction records

    Args:
        count (int, optional): count. Defaults to DEFAULT_COUNT.
        clear_existing (bool, optional): clear_existing. Defaults to False.

    Returns:
        list: List of created interaction objects
    """
    logger.info("Starting interaction seeding")

    if clear_existing:
        clear_interactions()

    # Ensure users and sites exist
    seed_users()
    seed_sites()

    # Get all available sites
    sites = Site.query.all()

    created_interactions = []

    # For each site, create proportional number of interaction records:
    for site in sites:
        # Calculate the number of interactions for this site
        site_count = int(count / len(sites))

        for _ in range(site_count):
            # Get a random user from the site for the creator
            creator = get_random_user_from_site(site)
            if not creator:
                logger.warning(f"No users found for site {site.name}, skipping interaction creation")
                continue

            # Generate random interaction data
            interaction = create_interaction(site, creator)
            created_interactions.append(interaction)

    db.session.commit()
    logger.info("Interaction seeding complete")
    return created_interactions


def run_seeder(count=DEFAULT_COUNT, clear_existing=False):
    """
    Entry point function that can be called from other modules

    Args:
        count (int, optional): count. Defaults to DEFAULT_COUNT.
        clear_existing (bool, optional): clear_existing. Defaults to False.

    Returns:
        list: List of created interaction objects
    """
    try:
        return seed_interactions(count, clear_existing)
    except Exception as e:
        logger.error(f"Error seeding interactions: {str(e)}")
        return []


if __name__ == "__main__":
    # Execute seeder if script is run directly
    run_seeder()