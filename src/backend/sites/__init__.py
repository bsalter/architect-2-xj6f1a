"""
Package initializer for the sites module in the Interaction Management System.

This module exports the sites blueprint for integration with the Flask application
and provides a method to initialize the sites module with the application instance.
The sites module implements the site-scoping security mechanism that restricts data
access based on user site associations.
"""

import logging  # standard library

from .routes import sites_bp
from .models import Site
from .services import SiteService

# Configure module logger
logger = logging.getLogger(__name__)

def init_app(app):
    """
    Initialize the sites module and register the sites blueprint with the Flask application.
    
    Args:
        app (Flask.Flask): The Flask application instance
        
    Returns:
        None
    """
    # Register the sites blueprint with the app
    app.register_blueprint(sites_bp, url_prefix='/api')
    
    # Log successful initialization
    logger.info("Sites module initialized successfully")
    
    # Any additional module-specific configuration can be added here

# Export elements for use in other modules
__all__ = ['sites_bp', 'Site', 'SiteService', 'init_app']