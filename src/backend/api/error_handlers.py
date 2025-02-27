"""
Centralized error handling module for the Interaction Management System API.

This module implements standardized error responses, custom exception types,
and Flask error handlers to ensure consistent error management across the application.
"""

# Standard library imports
import uuid
import traceback
from typing import Dict, List, Optional, Any

# Flask imports
from flask import jsonify, request, current_app, g
from werkzeug.exceptions import HTTPException

# Third-party imports
from marshmallow import ValidationError as MarshmallowError
from sqlalchemy.exc import SQLAlchemyError
import jwt

# Internal imports
from ..utils.logging import logger
from ..utils.validators import ValidationError
from ..utils.security import get_request_ip

# Error codes
ERROR_CODES = {
    "BAD_REQUEST": "BAD_REQUEST",
    "UNAUTHORIZED": "UNAUTHORIZED",
    "FORBIDDEN": "FORBIDDEN",
    "NOT_FOUND": "NOT_FOUND",
    "METHOD_NOT_ALLOWED": "METHOD_NOT_ALLOWED",
    "VALIDATION_ERROR": "VALIDATION_ERROR",
    "CONFLICT": "CONFLICT",
    "TOO_MANY_REQUESTS": "TOO_MANY_REQUESTS",
    "INTERNAL_SERVER_ERROR": "INTERNAL_SERVER_ERROR",
    "DATABASE_ERROR": "DATABASE_ERROR"
}

# Default error messages
ERROR_MESSAGES = {
    "BAD_REQUEST": "The request could not be understood or was missing required parameters.",
    "UNAUTHORIZED": "Authentication is required to access this resource.",
    "FORBIDDEN": "You do not have permission to access this resource.",
    "NOT_FOUND": "The requested resource was not found.",
    "METHOD_NOT_ALLOWED": "The method is not allowed for this resource.",
    "VALIDATION_ERROR": "The request contains invalid data.",
    "CONFLICT": "The request could not be completed due to a conflict with the current state of the resource.",
    "TOO_MANY_REQUESTS": "Too many requests. Please try again later.",
    "INTERNAL_SERVER_ERROR": "An unexpected error occurred.",
    "DATABASE_ERROR": "A database error occurred."
}


class AuthenticationError(Exception):
    """Custom exception for authentication failures."""
    
    def __init__(self, message=None):
        """Initialize an authentication error.
        
        Args:
            message: Custom error message (optional)
        """
        super().__init__(message or ERROR_MESSAGES["UNAUTHORIZED"])
        self.message = message or ERROR_MESSAGES["UNAUTHORIZED"]
        self.status_code = 401


class AuthorizationError(Exception):
    """Custom exception for authorization failures."""
    
    def __init__(self, message=None):
        """Initialize an authorization error.
        
        Args:
            message: Custom error message (optional)
        """
        super().__init__(message or ERROR_MESSAGES["FORBIDDEN"])
        self.message = message or ERROR_MESSAGES["FORBIDDEN"]
        self.status_code = 403


class ResourceNotFoundError(Exception):
    """Custom exception for resource not found situations."""
    
    def __init__(self, message=None, resource_type=None):
        """Initialize a resource not found error.
        
        Args:
            message: Custom error message (optional)
            resource_type: Type of resource that was not found
        """
        if resource_type and not message:
            message = f"{resource_type} not found."
        super().__init__(message or ERROR_MESSAGES["NOT_FOUND"])
        self.message = message or ERROR_MESSAGES["NOT_FOUND"]
        self.status_code = 404
        self.resource_type = resource_type


class ResourceConflictError(Exception):
    """Custom exception for resource conflicts."""
    
    def __init__(self, message=None):
        """Initialize a resource conflict error.
        
        Args:
            message: Custom error message (optional)
        """
        super().__init__(message or ERROR_MESSAGES["CONFLICT"])
        self.message = message or ERROR_MESSAGES["CONFLICT"]
        self.status_code = 409


def format_error_response(code: str, message: str, request_id: str, details: Optional[List] = None) -> Dict:
    """Formats error responses according to API standards.
    
    Args:
        code: Error code string
        message: Error message
        request_id: Unique identifier for request tracking
        details: Optional list of detailed error information
        
    Returns:
        Standardized error response dictionary
    """
    error_response = {
        "error": {
            "code": code,
            "message": message,
            "requestId": request_id
        }
    }
    
    # Add detailed errors if provided
    if details:
        error_response["error"]["details"] = details
    
    return error_response


def get_request_context() -> Dict[str, Any]:
    """Extracts relevant context information from the current request for logging.
    
    Returns:
        Dictionary with request context information
    """
    context = {
        "method": request.method,
        "url": request.url,
        "client_ip": get_request_ip()
    }
    
    # Add user information if available
    if hasattr(g, "user") and g.user:
        context["user_id"] = g.user.id
    
    # Add site context if available
    if hasattr(g, "site_context") and g.site_context:
        context["site_id"] = g.site_context.id
    
    return context


def handle_bad_request(error):
    """Handler for 400 Bad Request errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with error details and 400 status code
    """
    request_id = str(uuid.uuid4())
    
    # Log the error
    logger.warning(
        f"Bad Request: {str(error)}",
        extra={"request_id": request_id, **get_request_context()}
    )
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["BAD_REQUEST"],
        str(error) or ERROR_MESSAGES["BAD_REQUEST"],
        request_id
    )
    
    return jsonify(response), 400


def handle_unauthorized(error):
    """Handler for 401 Unauthorized errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with error details and 401 status code
    """
    request_id = str(uuid.uuid4())
    
    # Log the error with client IP for security monitoring
    logger.warning(
        f"Unauthorized: {str(error)}",
        extra={
            "request_id": request_id,
            "client_ip": get_request_ip(),
            "url": request.url
        }
    )
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["UNAUTHORIZED"],
        str(error) or ERROR_MESSAGES["UNAUTHORIZED"],
        request_id
    )
    
    return jsonify(response), 401


def handle_forbidden(error):
    """Handler for 403 Forbidden errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with error details and 403 status code
    """
    request_id = str(uuid.uuid4())
    
    # Get request context for logging
    context = get_request_context()
    
    # Log the error with user context
    logger.warning(
        f"Forbidden: {str(error)}",
        extra={"request_id": request_id, **context}
    )
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["FORBIDDEN"],
        str(error) or ERROR_MESSAGES["FORBIDDEN"],
        request_id
    )
    
    return jsonify(response), 403


def handle_not_found(error):
    """Handler for 404 Not Found errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with error details and 404 status code
    """
    request_id = str(uuid.uuid4())
    
    # Log the not found error with the requested URL
    logger.warning(
        f"Not Found: {request.url}",
        extra={"request_id": request_id, "url": request.url}
    )
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["NOT_FOUND"],
        str(error) or ERROR_MESSAGES["NOT_FOUND"],
        request_id
    )
    
    return jsonify(response), 404


def handle_method_not_allowed(error):
    """Handler for 405 Method Not Allowed errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with error details and 405 status code
    """
    request_id = str(uuid.uuid4())
    
    # Log the method not allowed error
    logger.warning(
        f"Method Not Allowed: {request.method} {request.url}",
        extra={"request_id": request_id, "method": request.method, "url": request.url}
    )
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["METHOD_NOT_ALLOWED"],
        str(error) or ERROR_MESSAGES["METHOD_NOT_ALLOWED"],
        request_id
    )
    
    return jsonify(response), 405


def handle_too_many_requests(error):
    """Handler for 429 Too Many Requests errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with error details and 429 status code
    """
    request_id = str(uuid.uuid4())
    
    # Get user information for rate limiting logging
    context = {
        "client_ip": get_request_ip(),
        "url": request.url
    }
    
    if hasattr(g, "user") and g.user:
        context["user_id"] = g.user.id
    
    # Log the rate limit error
    logger.warning(
        f"Rate Limit Exceeded: {str(error)}",
        extra={"request_id": request_id, **context}
    )
    
    # Format the error response
    response = format_error_response(
        ERROR_CODES["TOO_MANY_REQUESTS"],
        str(error) or ERROR_MESSAGES["TOO_MANY_REQUESTS"],
        request_id
    )
    
    # Create the response with headers
    resp = jsonify(response)
    
    # Add Retry-After header if available
    if hasattr(error, "retry_after"):
        resp.headers["Retry-After"] = str(error.retry_after)
    
    return resp, 429


def handle_validation_error(error):
    """Handler for validation errors from request data.
    
    Args:
        error: The ValidationError exception
        
    Returns:
        JSON response with validation error details and 400 status code
    """
    request_id = str(uuid.uuid4())
    
    # Get the validation errors
    validation_errors = error.to_dict()
    
    # Log the validation error
    logger.warning(
        f"Validation Error: {error.message}",
        extra={
            "request_id": request_id,
            "validation_errors": validation_errors,
            **get_request_context()
        }
    )
    
    # Format the detailed errors for the response
    details = []
    for field, message in validation_errors["errors"].items():
        details.append({"field": field, "message": message})
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["VALIDATION_ERROR"],
        error.message or ERROR_MESSAGES["VALIDATION_ERROR"],
        request_id,
        details
    )
    
    return jsonify(response), 400


def handle_marshmallow_error(error):
    """Handler for marshmallow schema validation errors.
    
    Args:
        error: The MarshmallowError exception
        
    Returns:
        JSON response with validation error details and 400 status code
    """
    request_id = str(uuid.uuid4())
    
    # Convert marshmallow errors to our format
    details = []
    if isinstance(error.messages, dict):
        for field, messages in error.messages.items():
            # If messages is a list, join them
            if isinstance(messages, list):
                message = "; ".join(messages)
            else:
                message = str(messages)
            details.append({"field": field, "message": message})
    
    # Log the validation error
    logger.warning(
        f"Schema Validation Error: {str(error)}",
        extra={
            "request_id": request_id,
            "validation_errors": error.messages,
            **get_request_context()
        }
    )
    
    # Format and return the error response
    response = format_error_response(
        ERROR_CODES["VALIDATION_ERROR"],
        ERROR_MESSAGES["VALIDATION_ERROR"],
        request_id,
        details
    )
    
    return jsonify(response), 400


def handle_sqlalchemy_error(error):
    """Handler for database-related errors.
    
    Args:
        error: The SQLAlchemyError exception
        
    Returns:
        JSON response with database error details and 500 status code
    """
    request_id = str(uuid.uuid4())
    
    # Log the database error
    logger.error(
        f"Database Error: {str(error)}",
        extra={
            "request_id": request_id,
            "traceback": traceback.format_exc(),
            **get_request_context()
        }
    )
    
    # Check if it's an integrity error that might indicate a conflict
    error_code = ERROR_CODES["DATABASE_ERROR"]
    error_message = ERROR_MESSAGES["DATABASE_ERROR"]
    status_code = 500
    
    # Detect integrity errors that might be conflicts
    if "IntegrityError" in error.__class__.__name__:
        if "unique constraint" in str(error).lower() or "duplicate key" in str(error).lower():
            error_code = ERROR_CODES["CONFLICT"]
            error_message = ERROR_MESSAGES["CONFLICT"]
            status_code = 409
    
    # Format and return the error response
    response = format_error_response(
        error_code,
        error_message,
        request_id
    )
    
    return jsonify(response), status_code


def handle_internal_server_error(error):
    """Handler for 500 Internal Server Error and unexpected errors.
    
    Args:
        error: The exception that triggered this handler
        
    Returns:
        JSON response with server error details and 500 status code
    """
    request_id = str(uuid.uuid4())
    
    # Get full traceback
    tb = traceback.format_exc()
    
    # Log the error with detailed information
    logger.error(
        f"Internal Server Error: {str(error)}",
        extra={
            "request_id": request_id,
            "traceback": tb,
            "error_type": error.__class__.__name__,
            **get_request_context()
        }
    )
    
    # Format the error response
    # Hide actual error details in production for security
    error_message = ERROR_MESSAGES["INTERNAL_SERVER_ERROR"]
    if current_app.debug:
        error_message = str(error)
    
    response = format_error_response(
        ERROR_CODES["INTERNAL_SERVER_ERROR"],
        error_message,
        request_id
    )
    
    return jsonify(response), 500


def register_error_handlers(app):
    """Registers all error handlers with the Flask application.
    
    Args:
        app: Flask application instance
    """
    # Register handlers for standard HTTP errors
    app.register_error_handler(400, handle_bad_request)
    app.register_error_handler(401, handle_unauthorized)
    app.register_error_handler(403, handle_forbidden)
    app.register_error_handler(404, handle_not_found)
    app.register_error_handler(405, handle_method_not_allowed)
    app.register_error_handler(429, handle_too_many_requests)
    app.register_error_handler(500, handle_internal_server_error)
    
    # Register handlers for custom exceptions
    app.register_error_handler(ValidationError, handle_validation_error)
    app.register_error_handler(MarshmallowError, handle_marshmallow_error)
    app.register_error_handler(SQLAlchemyError, handle_sqlalchemy_error)
    app.register_error_handler(AuthenticationError, handle_unauthorized)
    app.register_error_handler(AuthorizationError, handle_forbidden)
    app.register_error_handler(ResourceNotFoundError, handle_not_found)
    app.register_error_handler(ResourceConflictError, lambda err: (
        jsonify(format_error_response(
            ERROR_CODES["CONFLICT"],
            str(err) or ERROR_MESSAGES["CONFLICT"],
            str(uuid.uuid4())
        )),
        409
    ))
    
    # Catch-all handler for unhandled exceptions
    app.register_error_handler(Exception, handle_internal_server_error)
    
    # Log registration
    logger.info("Registered error handlers for application")