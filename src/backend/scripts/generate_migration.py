#!/usr/bin/env python3
"""
Migration script generator for the Interaction Management System.

This script generates Alembic migration files for database schema changes,
following the project's versioning strategy and migration conventions.
It supports creating empty migrations, auto-detecting schema changes,
and applying appropriate naming conventions.
"""

import os
import sys
import argparse
import datetime
from typing import Optional
from alembic.config import Config
from alembic import command

from ..utils.logging import get_request_logger

# Constants
ALEMBIC_CFG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'alembic.ini')
logger = get_request_logger(__name__)


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments for migration generation.

    Returns:
        argparse.Namespace: Parsed command line arguments
    """
    parser = argparse.ArgumentParser(
        description="Generate a new Alembic migration script for database schema changes"
    )
    
    parser.add_argument(
        "--message", "-m", 
        required=True,
        help="Message describing the migration (required)"
    )
    
    parser.add_argument(
        "--autogenerate", "-a",
        action="store_true",
        help="Detect schema changes automatically by comparing model metadata to database"
    )
    
    parser.add_argument(
        "--empty", "-e",
        action="store_true",
        help="Create an empty migration template without auto-generating changes"
    )
    
    parser.add_argument(
        "--sql", "-s", 
        action="store_true",
        help="Generate SQL statements instead of Python migration script"
    )
    
    parser.add_argument(
        "--branch-label", "-b",
        help="Specify a branch label for branched migrations"
    )
    
    parser.add_argument(
        "--version-path", "-p",
        help="Specify version path for the migration path"
    )
    
    return parser.parse_args()


def format_migration_message(message: str) -> str:
    """Format migration message for filename and description.
    
    Args:
        message: The raw migration message
    
    Returns:
        str: Formatted migration message suitable for filenames
    """
    # Convert to lowercase and replace spaces with underscores
    formatted = message.lower().replace(' ', '_')
    
    # Remove special characters that could cause issues in filenames
    import re
    formatted = re.sub(r'[^a-z0-9_]', '', formatted)
    
    return formatted


def generate_migration(
    message: str,
    autogenerate: bool = False,
    empty: bool = False,
    sql: bool = False,
    branch_label: Optional[str] = None,
    version_path: Optional[str] = None
) -> bool:
    """Generate a new database migration using Alembic.
    
    Args:
        message: Description of the migration
        autogenerate: Whether to detect changes automatically
        empty: Whether to create an empty migration template
        sql: Whether to generate SQL instead of Python
        branch_label: Optional branch label for the migration
        version_path: Optional version path for branched migrations
    
    Returns:
        bool: True if migration was generated successfully, False otherwise
    """
    try:
        # Load Alembic configuration
        config = Config(ALEMBIC_CFG_PATH)
        
        # Format the message for better filename compatibility
        formatted_message = format_migration_message(message)
        
        # Log the start of migration generation
        logger.info(
            f"Generating migration with message: '{message}'",
            extra={
                "autogenerate": autogenerate,
                "empty": empty,
                "sql": sql,
                "branch_label": branch_label,
                "version_path": version_path
            }
        )
        
        # Set additional options if provided
        opts = {}
        if branch_label:
            opts["branch_label"] = branch_label
        if version_path:
            opts["version_path"] = version_path
        
        # Generate the migration
        if empty:
            logger.info("Creating empty migration script")
            command.revision(config, message=message, **opts)
        elif autogenerate:
            logger.info("Auto-generating migration based on schema changes")
            command.revision(config, message=message, autogenerate=True, **opts)
        else:
            logger.info("Creating standard migration script")
            command.revision(config, message=message, **opts)
        
        # If SQL output is requested, generate SQL from the latest revision
        if sql:
            logger.info("Generating SQL from the latest revision")
            command.upgrade(config, "head", sql=True)
        
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        logger.info(f"Successfully generated migration at {timestamp}")
        
        return True
    
    except Exception as e:
        logger.error(f"Failed to generate migration: {str(e)}", exc_info=True)
        return False


def main() -> int:
    """Main entry point for the migration generation script.
    
    Returns:
        int: Exit code (0 for success, non-zero for failure)
    """
    try:
        # Parse command line arguments
        args = parse_arguments()
        
        # Log execution start
        logger.info(
            "Executing migration generator",
            extra={
                "message": args.message,
                "autogenerate": args.autogenerate,
                "empty": args.empty,
                "sql": args.sql
            }
        )
        
        # Generate the migration
        success = generate_migration(
            message=args.message,
            autogenerate=args.autogenerate,
            empty=args.empty,
            sql=args.sql,
            branch_label=args.branch_label,
            version_path=args.version_path
        )
        
        if success:
            logger.info("Migration generation completed successfully")
            return 0
        else:
            logger.error("Migration generation failed")
            return 1
            
    except Exception as e:
        logger.error(f"Unhandled exception in migration generator: {str(e)}", exc_info=True)
        return 2


if __name__ == "__main__":
    sys.exit(main())