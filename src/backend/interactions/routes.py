"""
Defines the RESTful API routes for the Interaction Management System's interaction resources.
This module establishes endpoints for listing, retrieving, creating, updating, and
deleting interactions, while enforcing authentication and site-scoping for data access control.
"""

from flask import Blueprint, request, jsonify  # version 2.3.2

from .controllers import (
    get_interactions,
    get_interaction,
    create_interaction,
    update_interaction,
    delete_interaction,
    get_interaction_types
)
from ..auth.middlewares import require_auth, require_site_context
from ..utils.pagination import get_pagination_params
from ..utils.logging import logger

# Create a blueprint for interaction routes
interactions_bp = Blueprint('interactions', __name__)


@interactions_bp.route('/', methods=['GET'])
@require_auth
@require_site_context
def list_interactions_route():
    """
    Route handler for retrieving a list of interactions with optional filtering and pagination.
    
    Returns:
        flask.Response: JSON response with paginated interactions
    """
    # Log incoming request
    logger.info(
        "Retrieving interactions list",
        extra={"component": "InteractionRoutes"}
    )
    
    # Forward to controller function
    response = get_interactions()
    
    return response


@interactions_bp.route('/<int:interaction_id>', methods=['GET'])
@require_auth
@require_site_context
def get_interaction_route(interaction_id):
    """
    Route handler for retrieving a single interaction by ID.
    
    Args:
        interaction_id (int): ID of the interaction to retrieve
    
    Returns:
        flask.Response: JSON response with interaction details
    """
    # Log incoming request
    logger.info(
        f"Retrieving interaction id={interaction_id}",
        extra={
            "component": "InteractionRoutes",
            "interaction_id": interaction_id
        }
    )
    
    # Forward to controller function
    response = get_interaction(interaction_id)
    
    return response


@interactions_bp.route('/', methods=['POST'])
@require_auth
@require_site_context
def create_interaction_route():
    """
    Route handler for creating a new interaction.
    
    Returns:
        flask.Response: JSON response with created interaction
    """
    # Log incoming request
    logger.info(
        "Creating new interaction",
        extra={"component": "InteractionRoutes"}
    )
    
    # Forward to controller function
    response = create_interaction()
    
    return response


@interactions_bp.route('/<int:interaction_id>', methods=['PUT'])
@require_auth
@require_site_context
def update_interaction_route(interaction_id):
    """
    Route handler for updating an existing interaction.
    
    Args:
        interaction_id (int): ID of the interaction to update
    
    Returns:
        flask.Response: JSON response with updated interaction
    """
    # Log incoming request
    logger.info(
        f"Updating interaction id={interaction_id}",
        extra={
            "component": "InteractionRoutes",
            "interaction_id": interaction_id
        }
    )
    
    # Forward to controller function
    response = update_interaction(interaction_id)
    
    return response


@interactions_bp.route('/<int:interaction_id>', methods=['DELETE'])
@require_auth
@require_site_context
def delete_interaction_route(interaction_id):
    """
    Route handler for deleting an interaction.
    
    Args:
        interaction_id (int): ID of the interaction to delete
    
    Returns:
        flask.Response: JSON response confirming deletion
    """
    # Log incoming request
    logger.info(
        f"Deleting interaction id={interaction_id}",
        extra={
            "component": "InteractionRoutes",
            "interaction_id": interaction_id
        }
    )
    
    # Forward to controller function
    response = delete_interaction(interaction_id)
    
    return response


@interactions_bp.route('/types', methods=['GET'])
@require_auth
@require_site_context
def get_interaction_types_route():
    """
    Route handler for retrieving the list of valid interaction types.
    
    Returns:
        flask.Response: JSON response with interaction types
    """
    # Log incoming request
    logger.info(
        "Retrieving interaction types",
        extra={"component": "InteractionRoutes"}
    )
    
    # Forward to controller function
    response = get_interaction_types()
    
    return response