#!/usr/bin/env python
"""
Database reset script for the Interaction Management System.

This script drops all existing tables and recreates the schema, providing
a clean slate for development or testing purposes. Optionally, it can also
reseed the database with sample data.

Usage:
  python reset_db.py [OPTIONS]

Options:
  --db-uri TEXT     Database URI to use (overrides environment settings)
  --env TEXT        Environment to use (development, testing, production)
  --verbose         Enable verbose logging
  --yes             Skip confirmation prompt
  --seed            Reseed database with sample data after reset
  --interactions N  Number of interactions to create if seeding (default: 50)
"""

import argparse
import os
import sys
import logging
from dotenv import load_dotenv

# Import modules based on how the script is being run
try:
    # Try relative imports first (when running as a module)
    from ..extensions import db
    from ..config import Config
    from ..database.models import *  # Import all models to ensure they're registered with SQLAlchemy
    from ..utils.logging import setup_logging
    from ..app import create_app
    from ..database.seeders.seed_data import seed_all
except ImportError:
    # If relative imports fail, try absolute imports (when running as a script)
    sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    from backend.extensions import db
    from backend.config import Config
    from backend.database.models import *  # Import all models to ensure they're registered with SQLAlchemy
    from backend.utils.logging import setup_logging
    from backend.app import create_app
    from backend.database.seeders.seed_data import seed_all

# Configure logger
logger = logging.getLogger(__name__)


def parse_args():
    """
    Parse command-line arguments for database reset options.
    
    Returns:
        argparse.Namespace: Parsed command-line arguments
    """
    parser = argparse.ArgumentParser(description="Reset the database for the Interaction Management System")
    
    # Add argument for database URI override
    parser.add_argument(
        "--db-uri",
        help="Database URI to use (overrides environment settings)",
        type=str,
    )
    
    # Add argument for environment selection
    parser.add_argument(
        "--env",
        help="Environment to use (development, testing, production)",
        type=str,
        choices=["development", "testing", "production"],
        default="development",
    )
    
    # Add argument for verbose mode
    parser.add_argument(
        "--verbose",
        help="Enable verbose logging",
        action="store_true",
    )
    
    # Add argument for confirmation flag
    parser.add_argument(
        "--yes",
        help="Skip confirmation prompt",
        action="store_true",
    )
    
    # Add argument for reseeding after reset
    parser.add_argument(
        "--seed",
        help="Reseed database with sample data after reset",
        action="store_true",
    )
    
    # Add argument for interaction count when seeding
    parser.add_argument(
        "--interactions",
        help="Number of interactions to create if seeding (default: 50)",
        type=int,
        default=50,
    )
    
    return parser.parse_args()


def reset_database(db_uri):
    """
    Resets the database by dropping and recreating all tables.
    
    Args:
        db_uri (str): Database URI to connect to
    
    Returns:
        bool: True if reset was successful, False otherwise
    """
    try:
        # Create application context with provided database URI
        app = create_app()
        app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
        
        with app.app_context():
            logger.warning(f"Resetting database at {db_uri}")
            
            # Drop all tables
            db.drop_all()
            logger.info("All tables dropped")
            
            # Create all tables
            db.create_all()
            logger.info("All tables recreated")
            
            return True
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return False


def seed_database(interaction_count):
    """
    Seeds the database with sample data after reset.
    
    Args:
        interaction_count (int): Number of interactions to create
    
    Returns:
        bool: True if seeding was successful, False otherwise
    """
    try:
        # Call seed_all function with specified interaction count
        result = seed_all(interaction_count=interaction_count)
        
        # Log success message with summary of created entities
        logger.info(f"Database seeded successfully with: "
                    f"{result['sites']} sites, {result['users']} users, "
                    f"and {result['interactions']} interactions")
        
        return True
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        return False


def main():
    """
    Main function to orchestrate the database reset process.
    
    Returns:
        int: Exit code (0 for success, 1 for failure)
    """
    # Load environment variables from .env file
    load_dotenv()
    
    # Parse command-line arguments
    args = parse_args()
    
    # Configure logging based on verbosity flag
    log_level = logging.DEBUG if args.verbose else logging.INFO
    setup_logging("reset_db", {'LOG_LEVEL': 'DEBUG' if args.verbose else 'INFO'})
    
    # Determine database URI from arguments, environment, or default
    db_uri = args.db_uri
    if not db_uri:
        # Set environment variable for Flask
        os.environ['FLASK_ENV'] = args.env
        
        # Get the appropriate configuration class
        if args.env == "development":
            db_uri = os.getenv("DEV_DATABASE_URL", Config.SQLALCHEMY_DATABASE_URI)
        elif args.env == "testing":
            db_uri = os.getenv("TEST_DATABASE_URL", Config.SQLALCHEMY_DATABASE_URI)
        elif args.env == "production":
            db_uri = os.getenv("PRODUCTION_DATABASE_URL", Config.SQLALCHEMY_DATABASE_URI)
        else:
            db_uri = Config.SQLALCHEMY_DATABASE_URI
    
    logger.info(f"Using environment: {args.env}")
    logger.info(f"Using database URI: {db_uri}")
    
    # If confirmation flag not set, prompt user for confirmation
    if not args.yes:
        confirm = input(f"This will reset the database at {db_uri}.\nAll data will be lost! Are you sure? [y/N]: ")
        if confirm.lower() not in ["y", "yes"]:
            logger.info("Operation cancelled by user")
            return 0
    
    # Reset database
    logger.info("Resetting database...")
    if not reset_database(db_uri):
        logger.error("Database reset failed")
        return 1
    
    logger.info("Database reset successful")
    
    # If seed flag is set, seed database with sample data
    if args.seed:
        logger.info(f"Seeding database with {args.interactions} interactions...")
        if not seed_database(args.interactions):
            logger.error("Database seeding failed")
            return 1
        logger.info("Database seeding successful")
    
    logger.info("Database reset operation completed successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())