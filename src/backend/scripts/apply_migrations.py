#!/usr/bin/env python3
"""
Script to apply database migrations using Alembic.
This script can be run from the command line to update the database schema 
to the latest version or to a specific revision.
"""

import argparse
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv  # version 1.0.0
import alembic.config  # version 1.11.1
import alembic.command  # version 1.11.1

# Adjust import paths to handle script being run directly
script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent  # src/backend
sys.path.append(str(backend_dir.parent))  # Add src to Python path

# Internal imports
from backend.config import Config
from backend.utils.logging import setup_logging

# Global variables
logger = logging.getLogger(__name__)
BASE_DIR = Path(__file__).resolve().parent.parent
ALEMBIC_INI_PATH = os.path.join(BASE_DIR, 'alembic.ini')
MIGRATIONS_DIR = os.path.join(BASE_DIR, 'database', 'migrations')


def parse_args():
    """
    Parses command-line arguments for the script.
    
    Returns:
        argparse.Namespace: Parsed command-line arguments
    """
    parser = argparse.ArgumentParser(description='Apply database migrations using Alembic.')
    parser.add_argument('--revision', default='head', 
                        help='Migration revision to upgrade to (default: "head")')
    parser.add_argument('--env', choices=['development', 'testing', 'staging', 'production'], 
                        default=None, help='Environment to use for configuration')
    parser.add_argument('--db-uri', help='Database URI to override the one in config')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    parser.add_argument('--show-history', action='store_true', 
                        help='Show migration history instead of applying migrations')
    return parser.parse_args()


def setup_alembic_config(db_uri, alembic_ini_path, migrations_dir):
    """
    Creates and configures the Alembic configuration object.
    
    Args:
        db_uri (str): Database URI to use for the migrations
        alembic_ini_path (str): Path to the alembic.ini file
        migrations_dir (str): Path to the migrations directory
    
    Returns:
        alembic.config.Config: Configured Alembic configuration object
    """
    # Create an Alembic Config object pointing to the alembic.ini file
    alembic_cfg = alembic.config.Config(alembic_ini_path)
    
    # Set the path to the migrations directory
    alembic_cfg.set_main_option('script_location', migrations_dir)
    
    # Override the SQLAlchemy URL in the config
    alembic_cfg.set_main_option('sqlalchemy.url', db_uri)
    
    return alembic_cfg


def run_migration(alembic_cfg, revision):
    """
    Executes the Alembic upgrade command to apply migrations.
    
    Args:
        alembic_cfg (alembic.config.Config): Configured Alembic configuration object
        revision (str): Migration revision to upgrade to
    
    Returns:
        bool: True if migrations were successful, False otherwise
    """
    try:
        logger.info(f"Starting migration to revision: {revision}")
        # Run alembic upgrade command with the specified revision
        alembic.command.upgrade(alembic_cfg, revision)
        logger.info(f"Migration to revision {revision} completed successfully")
        return True
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return False


def show_migration_history(alembic_cfg, verbose):
    """
    Displays the migration history.
    
    Args:
        alembic_cfg (alembic.config.Config): Configured Alembic configuration object
        verbose (bool): Whether to show verbose output
    
    Returns:
        bool: True if history display was successful, False otherwise
    """
    try:
        logger.info("Showing migration history")
        # Run alembic history command with appropriate verbosity
        if verbose:
            alembic.command.history(alembic_cfg, verbose=True)
        else:
            alembic.command.history(alembic_cfg)
        return True
    except Exception as e:
        logger.error(f"Failed to show migration history: {str(e)}")
        return False


def main():
    """
    Main function that orchestrates the migration process.
    
    Returns:
        int: Exit code (0 for success, 1 for failure)
    """
    # Load environment variables from .env file
    load_dotenv()
    
    # Parse command-line arguments
    args = parse_args()
    
    # Set up logging based on verbosity
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logging('alembic_migrations', config={'LOG_LEVEL': 'DEBUG' if args.verbose else 'INFO'})
    
    # Determine database URI from arguments, environment, or config
    db_uri = args.db_uri
    if not db_uri:
        if args.env:
            # Set the environment variable to use the correct config class
            os.environ['FLASK_ENV'] = args.env
        
        # Get database URI from Config
        db_uri = Config.SQLALCHEMY_DATABASE_URI
    
    # Create and configure Alembic config object
    alembic_cfg = setup_alembic_config(db_uri, ALEMBIC_INI_PATH, MIGRATIONS_DIR)
    
    # If show-history flag is present, show migration history and exit
    if args.show_history:
        success = show_migration_history(alembic_cfg, args.verbose)
        return 0 if success else 1
    
    # Run the migration to the specified revision
    success = run_migration(alembic_cfg, args.revision)
    
    # Return appropriate exit code based on migration success
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())