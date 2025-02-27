"""
Initializes the interactions module for the Interaction Management System, creating and configuring a Flask Blueprint for interaction-related API endpoints. This module serves as the entry point for the interactions package, exposing core components for use in the main application.
"""

# External imports
from flask import Flask  # version 2.3.2

# Internal imports
from .routes import interactions_bp
from .models import Interaction
from .services import InteractionService
from .schemas import (
    InteractionCreateSchema,
    InteractionUpdateSchema,
    InteractionResponseSchema,
    InteractionSearchSchema
)
from ..utils.logging import logger

# Create aliases for schemas specified in the requirements but not implemented
# This maintains compatibility with expected exports
InteractionSchema = InteractionResponseSchema
InteractionListResponseSchema = InteractionResponseSchema

# Version information
__version__ = '1.0.0'

def init_app(app: Flask) -> None:
    """
    Initializes the interactions module with the Flask application.
    
    Args:
        app: Flask application instance
        
    Returns:
        None
    """
    # Register the interactions blueprint with the Flask app
    app.register_blueprint(interactions_bp, url_prefix='/api/interactions')
    
    # Log successful initialization
    logger.info(
        "Interactions module initialized",
        extra={"component": "Interactions"}
    )