"""
Alembic environment configuration file for database migrations.

This module configures Alembic to run migrations against the database, either in
'online' mode (directly applying changes to the database) or 'offline' mode 
(generating SQL scripts). It connects to the database using configuration from
the application and manages the migration context for the Interaction Management System.
"""

import logging
import os
from configparser import ConfigParser
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import application components needed for migrations
import sys
# Add the parent directory of the migrations package to the Python path
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, parent_dir)

from extensions import db
from config import get_config

# This is the Alembic Config object, which provides access to the values in alembic.ini
config = ConfigParser()
config.read_file(open('src/backend/alembic.ini'))
fileConfig('src/backend/alembic.ini')

# Set up logger for alembic env
logger = logging.getLogger('alembic.env')

# Get application config to access database settings
app_config = get_config()

# Add model metadata to migration context
target_metadata = db.Model.metadata

def get_url():
    """
    Determine the database URL to use for migrations from either the app config or alembic.ini.
    
    Returns:
        str: Database connection URL
    """
    # Try to get database URL from application config
    try:
        return app_config.SQLALCHEMY_DATABASE_URI
    except (AttributeError, KeyError):
        # Fall back to alembic.ini config if app config doesn't have it
        return config.get('alembic', 'sqlalchemy.url')

def run_migrations_offline():
    """
    Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine,
    though an Engine is acceptable here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.
    
    Calls to context.execute() here emit the given string to the script output.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """
    Run migrations in 'online' mode.
    
    In this scenario we need to create an Engine and associate a connection with the context.
    
    This is the preferred way to run migrations, directly applying changes to the database.
    """
    # Get database URL from application config or alembic.ini
    url = get_url()
    
    # Configure the engine
    engine_config = {
        'sqlalchemy.url': url
    }
    
    # Copy relevant settings from alembic.ini
    section = config.sections()[0]
    for key, value in config.items(section):
        if key.startswith('sqlalchemy.'):
            engine_config[key] = value
    
    # Create the engine
    connectable = engine_from_config(
        engine_config,
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

# Execute the appropriate migration mode
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()