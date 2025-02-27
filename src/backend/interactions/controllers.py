"""
Controller layer for the Interaction Management System that handles HTTP requests for interaction resources.
Implements controller functions for CRUD operations, search functionality, and type retrieval,
while enforcing site-scoping and proper error handling.
"""

from flask import request, g, jsonify
from werkzeug.exceptions import BadRequest
from typing import Dict, Any, Union
import marshmallow

from .services import InteractionService
from .schemas import (
    InteractionCreateSchema,
    InteractionUpdateSchema,
    InteractionResponseSchema,
    InteractionSearchSchema
)
from ..api.error_handlers import ResourceNotFoundError, ValidationError, AuthorizationError, format_error_response
from ..utils.logging import logger

# Initialize service and schema instances
interaction_service = InteractionService()
create_schema = InteractionCreateSchema()
update_schema = InteractionUpdateSchema()
response_schema = InteractionResponseSchema()
search_schema = InteractionSearchSchema()


def get_interactions():
    """
    Controller function for retrieving all interactions with filtering, sorting, and pagination.
    
    Returns:
        flask.Response: JSON response with paginated interactions
    """
    try:
        # Extract site_id from flask g.site_context
        site_id = g.site_context
        
        # Parse request arguments to get search parameters, page, page_size, sort_field, and sort_direction
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 25, type=int)
        sort_field = request.args.get('sort', 'created_at')
        sort_direction = request.args.get('direction', 'desc')
        
        # Extract search filters from request args
        search_filters = {}
        for param, value in request.args.items():
            if param not in ['page', 'page_size', 'sort', 'direction']:
                search_filters[param] = value
        
        # Validate search parameters using search_schema
        if search_filters:
            try:
                search_filters = search_schema.load(search_filters)
            except marshmallow.exceptions.ValidationError as err:
                return handle_validation_errors(err)
            
            # If validation passes, call interaction_service.search with filters
            result = interaction_service.search(
                site_id=site_id,
                filters=search_filters,
                page=page,
                page_size=page_size,
                sort_field=sort_field,
                sort_direction=sort_direction
            )
        else:
            # If no search filters, call interaction_service.get_all
            result = interaction_service.get_all(
                site_id=site_id,
                page=page,
                page_size=page_size,
                sort_field=sort_field,
                sort_direction=sort_direction
            )
        
        # Format paginated results using response_schema
        formatted_interactions = []
        for interaction in result.items:
            formatted_interactions.append(interaction)
        
        # Return JSON response with interactions data and pagination metadata
        return jsonify({
            'status': 'success',
            'data': {
                'interactions': formatted_interactions
            },
            'meta': {
                'pagination': {
                    'page': result.page,
                    'page_size': result.page_size,
                    'total': result.total,
                    'total_pages': result.total_pages
                }
            }
        })
    
    except ValidationError as err:
        return handle_validation_errors(err)
    
    except Exception as e:
        logger.error(
            f"Error retrieving interactions: {str(e)}",
            extra={"component": "InteractionController"}
        )
        error_response = format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while retrieving interactions",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 500


def get_interaction(interaction_id: int):
    """
    Controller function for retrieving a single interaction by ID.
    
    Args:
        interaction_id: ID of the interaction to retrieve
        
    Returns:
        flask.Response: JSON response with the interaction details
    """
    try:
        # Extract site_id from flask g.site_context
        site_id = g.site_context
        
        # Call interaction_service.get_by_id with interaction_id and site_id
        interaction = interaction_service.get_by_id(interaction_id, site_id)
        
        # Format the interaction using response_schema
        interaction_data = response_schema.dump(interaction)
        
        # Return JSON response with interaction data
        return jsonify({
            'status': 'success',
            'data': {
                'interaction': interaction_data
            }
        })
    
    except ResourceNotFoundError:
        # If interaction not found or not in user's site, ResourceNotFoundError is raised by service
        logger.warning(
            f"Interaction not found: id={interaction_id}",
            extra={"component": "InteractionController", "interaction_id": interaction_id}
        )
        error_response = format_error_response(
            code="NOT_FOUND",
            message=f"Interaction with id {interaction_id} not found",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 404
    
    except Exception as e:
        logger.error(
            f"Error retrieving interaction {interaction_id}: {str(e)}",
            extra={"component": "InteractionController", "interaction_id": interaction_id}
        )
        error_response = format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while retrieving the interaction",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 500


def create_interaction():
    """
    Controller function for creating a new interaction.
    
    Returns:
        flask.Response: JSON response with the created interaction
    """
    try:
        # Extract site_id from flask g.site_context
        site_id = g.site_context
        
        # Extract user_id from flask g.user
        user_id = g.user
        
        # Parse JSON data from request
        data = request.get_json()
        if not data:
            error_response = format_error_response(
                code="BAD_REQUEST",
                message="No data provided",
                request_id=request.headers.get('X-Request-ID', '')
            )
            return jsonify(error_response), 400
        
        # Validate request data using create_schema
        try:
            validated_data = create_schema.load(data)
        except marshmallow.exceptions.ValidationError as err:
            return handle_validation_errors(err)
        
        # Call interaction_service.create with validated data, site_id, and user_id
        interaction = interaction_service.create(validated_data, site_id, user_id)
        
        # Format the created interaction using response_schema
        interaction_data = response_schema.dump(interaction)
        
        # Return JSON response with created interaction data and 201 Created status
        return jsonify({
            'status': 'success',
            'data': {
                'interaction': interaction_data
            },
            'message': 'Interaction created successfully'
        }), 201
    
    except ValidationError as err:
        return handle_validation_errors(err)
    
    except Exception as e:
        logger.error(
            f"Error creating interaction: {str(e)}",
            extra={"component": "InteractionController"}
        )
        error_response = format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while creating the interaction",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 500


def update_interaction(interaction_id: int):
    """
    Controller function for updating an existing interaction.
    
    Args:
        interaction_id: ID of the interaction to update
        
    Returns:
        flask.Response: JSON response with the updated interaction
    """
    try:
        # Extract site_id from flask g.site_context
        site_id = g.site_context
        
        # Extract user_id from flask g.user
        user_id = g.user
        
        # Parse JSON data from request
        data = request.get_json()
        if not data:
            error_response = format_error_response(
                code="BAD_REQUEST",
                message="No data provided",
                request_id=request.headers.get('X-Request-ID', '')
            )
            return jsonify(error_response), 400
        
        # Validate request data using update_schema
        try:
            validated_data = update_schema.load(data)
        except marshmallow.exceptions.ValidationError as err:
            return handle_validation_errors(err)
        
        # Call interaction_service.update with interaction_id, validated data, site_id, and user_id
        interaction = interaction_service.update(interaction_id, validated_data, site_id, user_id)
        
        # Format the updated interaction using response_schema
        interaction_data = response_schema.dump(interaction)
        
        # Return JSON response with updated interaction data
        return jsonify({
            'status': 'success',
            'data': {
                'interaction': interaction_data
            },
            'message': 'Interaction updated successfully'
        })
    
    except ResourceNotFoundError:
        # If interaction not found or not in user's site, ResourceNotFoundError is raised by service
        logger.warning(
            f"Interaction not found for update: id={interaction_id}",
            extra={"component": "InteractionController", "interaction_id": interaction_id}
        )
        error_response = format_error_response(
            code="NOT_FOUND",
            message=f"Interaction with id {interaction_id} not found",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 404
    
    except ValidationError as err:
        return handle_validation_errors(err)
    
    except Exception as e:
        logger.error(
            f"Error updating interaction {interaction_id}: {str(e)}",
            extra={"component": "InteractionController", "interaction_id": interaction_id}
        )
        error_response = format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while updating the interaction",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 500


def delete_interaction(interaction_id: int):
    """
    Controller function for deleting an interaction.
    
    Args:
        interaction_id: ID of the interaction to delete
        
    Returns:
        flask.Response: JSON response confirming deletion
    """
    try:
        # Extract site_id from flask g.site_context
        site_id = g.site_context
        
        # Call interaction_service.delete with interaction_id and site_id
        interaction_service.delete(interaction_id, site_id)
        
        # Return JSON response with success message and 200 OK status
        return jsonify({
            'status': 'success',
            'message': f'Interaction with id {interaction_id} deleted successfully'
        })
    
    except ResourceNotFoundError:
        # If interaction not found or not in user's site, ResourceNotFoundError is raised by service
        logger.warning(
            f"Interaction not found for deletion: id={interaction_id}",
            extra={"component": "InteractionController", "interaction_id": interaction_id}
        )
        error_response = format_error_response(
            code="NOT_FOUND",
            message=f"Interaction with id {interaction_id} not found",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 404
    
    except Exception as e:
        logger.error(
            f"Error deleting interaction {interaction_id}: {str(e)}",
            extra={"component": "InteractionController", "interaction_id": interaction_id}
        )
        error_response = format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while deleting the interaction",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 500


def get_interaction_types():
    """
    Controller function for retrieving the list of valid interaction types.
    
    Returns:
        flask.Response: JSON response with the interaction types
    """
    try:
        # Call interaction_service.get_types to get list of valid interaction types
        types = interaction_service.get_types()
        
        # Return JSON response with types list and 200 OK status
        return jsonify({
            'status': 'success',
            'data': {
                'types': types
            }
        })
    
    except Exception as e:
        logger.error(
            f"Error retrieving interaction types: {str(e)}",
            extra={"component": "InteractionController"}
        )
        error_response = format_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An error occurred while retrieving interaction types",
            request_id=request.headers.get('X-Request-ID', '')
        )
        return jsonify(error_response), 500


def handle_validation_errors(error: Union[ValidationError, marshmallow.exceptions.ValidationError]):
    """
    Helper function to handle validation errors consistently.
    
    Args:
        error: ValidationError or marshmallow.exceptions.ValidationError
        
    Returns:
        flask.Response: JSON response with validation errors
    """
    # Log validation error details
    logger.warning(
        f"Validation error: {str(error)}",
        extra={"component": "InteractionController"}
    )
    
    # If marshmallow ValidationError, extract error messages
    if isinstance(error, marshmallow.exceptions.ValidationError):
        error_details = []
        for field, messages in error.messages.items():
            if isinstance(messages, list):
                message = "; ".join(messages)
            else:
                message = str(messages)
            error_details.append({"field": field, "message": message})
    # If custom ValidationError, call error.to_dict() to get error details
    elif isinstance(error, ValidationError):
        error_details = []
        for field, message in error.errors.items():
            error_details.append({"field": field, "message": message})
    else:
        error_details = [{"message": str(error)}]
    
    # Use format_error_response to create standardized error response
    error_response = format_error_response(
        code="VALIDATION_ERROR",
        message="The request contains invalid data",
        request_id=request.headers.get('X-Request-ID', ''),
        details=error_details
    )
    
    # Return JSON response with error details and 400 Bad Request status
    return jsonify(error_response), 400