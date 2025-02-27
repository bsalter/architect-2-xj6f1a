"""
Initialization file for the scripts package that makes database manipulation utility functions available to the application. This file imports and exports key database and migration management functions from individual script modules to provide a unified interface for database operations.
"""
# Standard library import
import logging  # version: standard library

# Internal imports
from .create_db import ensure_database_exists  # Purpose: Import function to check and create database if needed
from .create_db import create_tables  # Purpose: Import function to create database tables
from .reset_db import reset_database  # Purpose: Import function to reset database tables
from .reset_db import seed_database  # Purpose: Import function to seed database with test data
from .generate_migration import generate_migration  # Purpose: Import function to generate new Alembic migration files
from .apply_migrations import run_migration  # Purpose: Import function to apply Alembic migrations
from .apply_migrations import setup_alembic_config  # Purpose: Import function to configure Alembic for migrations
from .apply_migrations import show_migration_history  # Purpose: Import function to display migration history

# Set up logger
logger = logging.getLogger(__name__)

# Define public interface
__all__ = ["ensure_database_exists", "create_tables", "reset_database", "seed_database", "generate_migration", "run_migration", "setup_alembic_config", "show_migration_history"]

# Log initialization of the scripts package
logger.info("Initialized scripts package")