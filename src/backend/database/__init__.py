"""
Database package initialization for Interaction Management System.

This module initializes the database package and exports the SQLAlchemy models
and database instance for use throughout the application. It provides access
to the core data models that implement site-scoped data isolation and
interaction management.
"""

# Import models to make them available through the database package
from .models import User, Site, UserSiteMapping, Interaction
# Import SQLAlchemy database instance for session management
from ..extensions import db

# Define what's available when importing from this package
__all__ = ["User", "Site", "UserSiteMapping", "Interaction", "db"]