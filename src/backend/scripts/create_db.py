#!/usr/bin/env python
"""
Script to create and initialize the database for the Interaction Management System.

This utility creates the database if it doesn't exist and sets up the initial schema
based on SQLAlchemy models. It can be configured via command-line arguments or environment variables.

Usage:
    python create_db.py [options]

Options:
    --db-uri URI       Specify the database URI directly
    --env ENV          Set the environment (development, testing, staging, production)
    --verbose          Enable verbose logging

Examples:
    python create_db.py --env development
    python create_db.py --db-uri postgresql://user:pass@localhost/mydatabase
"""

import argparse
import os
import sys
import logging

from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from sqlalchemy.sql import text
from dotenv import load_dotenv  # version 1.0.0

# Internal imports
from ..extensions import db
from ..config import Config
from ..database.models import *  # Import all models to ensure they're registered with SQLAlchemy
from ..utils.logging import setup_logging
from ..app import create_app

# Set up logging
logger = logging.getLogger(__name__)

# Default database URI if not configured
DEFAULT_DB_URI = "postgresql://postgres:postgres@localhost:5432/interaction_db"


def parse_args():
    """
    Parse command-line arguments for database creation options.
    
    Returns:
        argparse.Namespace: Parsed command-line arguments
    """
    parser = argparse.ArgumentParser(
        description="Create and initialize the database for the Interaction Management System"
    )
    
    parser.add_argument(
        "--db-uri",
        help=f"Database URI (default: {DEFAULT_DB_URI} or from environment)",
        default=None
    )
    
    parser.add_argument(
        "--env",
        help="Environment (development, testing, staging, production)",
        choices=['development', 'testing', 'staging', 'production'],
        default=None
    )
    
    parser.add_argument(
        "--verbose",
        help="Enable verbose logging",
        action="store_true"
    )
    
    return parser.parse_args()


def ensure_database_exists(db_uri):
    """
    Ensures the database exists, creating it if necessary.
    
    Args:
        db_uri (str): Database URI
    
    Returns:
        bool: True if database exists or was created successfully
    """
    try:
        # Parse the database URI to extract database name and server URI
        parsed_url = URL.create(db_uri) if hasattr(URL, 'create') else URL.make_url(db_uri)
        db_name = parsed_url.database
        
        # Create a server URL without the database name for checking/creating the database
        if hasattr(parsed_url, 'set'):
            # SQLAlchemy 1.4+
            server_url = parsed_url.set(database=None)
        else:
            # SQLAlchemy 1.3
            server_url = parsed_url
            server_url.database = None
        
        logger.info(f"Checking if database '{db_name}' exists")
        
        # Create engine to connect to the server (without specific database)
        engine = create_engine(server_url)
        
        # Check if database exists by attempting connection
        try:
            # Try to connect to the database directly
            check_engine = create_engine(db_uri)
            with check_engine.connect():
                logger.info(f"Database '{db_name}' already exists")
                return True
        except Exception:
            logger.info(f"Database '{db_name}' does not exist, creating...")
            
            # Connect to server and create database
            try:
                with engine.connect() as conn:
                    # Set autocommit mode to execute CREATE DATABASE command
                    conn = conn.execution_options(isolation_level="AUTOCOMMIT")
                    conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                    logger.info(f"Database '{db_name}' created successfully")
                    return True
            except Exception as e:
                logger.error(f"Failed to create database: {str(e)}")
                return False
    except Exception as e:
        logger.error(f"Failed to ensure database exists: {str(e)}")
        return False


def create_tables(db_uri):
    """
    Creates all database tables based on SQLAlchemy models.
    
    Args:
        db_uri (str): Database URI
    
    Returns:
        bool: True if tables were created successfully
    """
    try:
        # Create a Flask application context with the provided database URI
        app = create_app()
        app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
        
        with app.app_context():
            logger.info("Creating database tables based on models")
            db.create_all()
            logger.info("All tables created successfully")
        
        return True
    except Exception as e:
        logger.error(f"Failed to create tables: {str(e)}")
        return False


def main():
    """
    Main function to orchestrate the database creation process.
    
    Returns:
        int: Exit code: 0 for success, 1 for failure
    """
    # Load environment variables from .env file
    load_dotenv()
    
    # Parse command-line arguments
    args = parse_args()
    
    # Configure logging based on verbosity flag
    log_level = "DEBUG" if args.verbose else "INFO"
    setup_logging("db_creator", {"LOG_LEVEL": log_level})
    
    # Determine database URI to use:
    # 1. Command-line argument
    # 2. Environment variable based on specified environment
    # 3. Default from Config
    db_uri = args.db_uri
    
    if not db_uri:
        if args.env:
            # Get environment-specific database URL
            if args.env == 'development':
                db_uri = os.environ.get('DEV_DATABASE_URL', Config.SQLALCHEMY_DATABASE_URI)
            elif args.env == 'testing':
                db_uri = os.environ.get('TEST_DATABASE_URL', Config.SQLALCHEMY_DATABASE_URI)
            elif args.env == 'staging':
                db_uri = os.environ.get('STAGING_DATABASE_URL', Config.SQLALCHEMY_DATABASE_URI)
            elif args.env == 'production':
                db_uri = os.environ.get('PRODUCTION_DATABASE_URL', Config.SQLALCHEMY_DATABASE_URI)
        else:
            # Use default from environment or Config
            db_uri = os.environ.get('DATABASE_URL', Config.SQLALCHEMY_DATABASE_URI)
    
    # If still no db_uri found, use the default
    if not db_uri:
        db_uri = DEFAULT_DB_URI
    
    logger.info(f"Using database URI: {db_uri}")
    
    # Ensure the database exists
    if not ensure_database_exists(db_uri):
        logger.error("Failed to ensure database exists, exiting")
        return 1
    
    # Create all tables based on models
    if not create_tables(db_uri):
        logger.error("Failed to create tables, exiting")
        return 1
    
    logger.info("Database initialization complete")
    return 0


# Run the script if executed directly
if __name__ == '__main__':
    sys.exit(main())