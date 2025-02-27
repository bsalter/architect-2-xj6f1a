"""
Initialization module for the Interaction Management System API.

This module serves as the entry point for the API component, exposing error handling
mechanisms and route registration functionality to the main application. It provides
a clean interface for setting up the API layer with standardized error handling,
consistent response formatting, and organized routing.
"""

from typing import Optional

from flask import Flask  # version 2.3.2

# Import error handling components
from .error_handlers import (
    register_error_handlers,
    format_error_response,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ResourceConflictError
)

# Import routing components
from .routes import register_api_routes, api_bp


def init_app(app: Flask) -> None:
    """
    Initializes the API module with a Flask application instance.
    
    This function sets up error handlers and registers API routes with the provided
    Flask application. It centralizes the API initialization process to ensure
    consistent configuration across all API components.
    
    Args:
        app: Flask application instance to initialize
        
    Returns:
        None
    """
    # Register error handlers with the Flask app
    register_error_handlers(app)
    
    # Register API routes with the Flask app
    register_api_routes(app)


# Re-export components for use in the main application
__all__ = [
    'init_app',
    'api_bp',
    'format_error_response',
    'AuthenticationError',
    'AuthorizationError',
    'ResourceNotFoundError',
    'ResourceConflictError'
]