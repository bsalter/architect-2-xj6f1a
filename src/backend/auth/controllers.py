"""
Controller layer for authentication and authorization in the Interaction Management System.
Handles HTTP requests related to user authentication, login/logout operations, password management,
and site context management. Serves as an intermediary between auth routes and the AuthService.
"""

from flask import jsonify, request, g, current_app
from werkzeug.exceptions import HTTPException, BadRequest, Unauthorized, Forbidden

from .services import AuthService
from .models import User
from ..utils.security import log_security_event, get_request_ip
from ..utils.validators import validate_email, ValidationError

# Initialize authentication service
auth_service = AuthService()


def login_controller():
    """
    Handles user login requests by validating credentials and returning JWT tokens.
    
    Returns:
        flask.Response: JSON response with authentication token and user details
    """
    try:
        # Extract credentials from request
        data = request.get_json()
        if not data:
            raise BadRequest("Missing request body")
        
        # Extract and validate credentials
        username = data.get('username')
        password = data.get('password')
        
        if not username:
            raise BadRequest("Username is required")
        
        if not password:
            raise BadRequest("Password is required")
        
        # Attempt login with AuthService
        auth_result = auth_service.login(username, password)
        
        # Log successful login with IP address
        log_security_event('login_success', {
            'username': username,
            'user_id': auth_result['user']['id'],
            'ip_address': get_request_ip()
        })
        
        # Return authentication result as JSON
        return jsonify(auth_result)
    
    except (BadRequest, Unauthorized, Forbidden) as e:
        # Pass through known HTTP exceptions to error handler
        return handle_auth_error(e)
    except Exception as e:
        # Handle unexpected errors
        log_security_event('login_failure', {
            'error': str(e),
            'ip_address': get_request_ip()
        }, level='error')
        return handle_auth_error(e)


def logout_controller():
    """
    Handles user logout requests by invalidating JWT tokens.
    
    Returns:
        flask.Response: JSON response confirming logout
    """
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            # Also check for token in cookies as fallback
            token = request.cookies.get('auth_token')
            if not token:
                raise BadRequest("Missing or invalid authentication token")
        else:
            token = auth_header.split(' ')[1]
        
        # Get user ID from request context for logging
        user_id = None
        if hasattr(g, 'current_user') and isinstance(g.current_user, User):
            user_id = g.current_user.id
        
        # Logout using AuthService
        auth_service.logout(token)
        
        # Log successful logout
        log_security_event('logout', {
            'user_id': user_id,
            'ip_address': get_request_ip()
        })
        
        return jsonify({
            'success': True,
            'message': 'Successfully logged out'
        })
    
    except Exception as e:
        return handle_auth_error(e)


def get_current_user_controller():
    """
    Provides information about the currently authenticated user.
    
    Returns:
        flask.Response: JSON response with user details and site information
    """
    try:
        # Access the authenticated user from flask.g
        if not hasattr(g, 'current_user') or not isinstance(g.current_user, User):
            raise Unauthorized("Not authenticated")
        
        user = g.current_user
        
        # Get user's sites using AuthService
        sites = auth_service.get_user_sites(user)
        
        # Format user data for response
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'sites': sites
        }
        
        return jsonify({
            'user': user_data
        })
    
    except Exception as e:
        return handle_auth_error(e)


def set_site_context_controller():
    """
    Changes the current site context for the authenticated user.
    
    Returns:
        flask.Response: JSON response with updated site context
    """
    try:
        # Extract site_id from request
        data = request.get_json()
        if not data:
            raise BadRequest("Missing request body")
        
        site_id = data.get('site_id')
        if not site_id:
            raise BadRequest("site_id is required")
        
        # Ensure user is authenticated
        if not hasattr(g, 'current_user') or not isinstance(g.current_user, User):
            raise Unauthorized("Not authenticated")
        
        user = g.current_user
        
        # Set site context using AuthService
        site_context = auth_service.set_site_context(user, site_id)
        
        # Log site context change
        log_security_event('site_context_change', {
            'user_id': user.id,
            'site_id': site_id,
            'ip_address': get_request_ip()
        })
        
        return jsonify({
            'success': True,
            'site_context': site_context
        })
    
    except Exception as e:
        return handle_auth_error(e)


def request_password_reset_controller():
    """
    Initiates password reset process for a user.
    
    Returns:
        flask.Response: JSON response confirming the reset request
    """
    try:
        # Extract email from request
        data = request.get_json()
        if not data:
            raise BadRequest("Missing request body")
        
        email = data.get('email')
        if not email:
            raise BadRequest("Email is required")
        
        # Validate email format
        if not validate_email(email):
            raise BadRequest("Invalid email format")
        
        # Request password reset token
        auth_service.request_password_reset(email)
        
        # Log password reset request (with masked email for privacy)
        masked_email = email[0:2] + '*' * (len(email.split('@')[0]) - 2) + '@' + email.split('@')[1]
        log_security_event('password_reset_request', {
            'masked_email': masked_email,
            'ip_address': get_request_ip()
        })
        
        # Always return success to prevent email enumeration
        return jsonify({
            'success': True,
            'message': 'If your email exists in our system, you will receive password reset instructions'
        })
    
    except Exception as e:
        return handle_auth_error(e)


def reset_password_controller():
    """
    Completes password reset using a valid reset token.
    
    Returns:
        flask.Response: JSON response confirming password reset
    """
    try:
        # Extract token and new password from request
        data = request.get_json()
        if not data:
            raise BadRequest("Missing request body")
        
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token:
            raise BadRequest("Reset token is required")
        
        if not new_password:
            raise BadRequest("New password is required")
        
        # Reset password using AuthService
        auth_service.reset_password(token, new_password)
        
        # Log successful password reset
        log_security_event('password_reset_complete', {
            'ip_address': get_request_ip()
        })
        
        return jsonify({
            'success': True,
            'message': 'Password has been reset successfully'
        })
    
    except Exception as e:
        return handle_auth_error(e)


def handle_auth_error(error):
    """
    Formats authentication errors into consistent JSON responses.
    
    Args:
        error (Exception): The error that occurred
        
    Returns:
        flask.Response: JSON response with error details
    """
    # Determine status code based on error type
    if isinstance(error, BadRequest):
        status_code = 400
    elif isinstance(error, Unauthorized):
        status_code = 401
    elif isinstance(error, Forbidden):
        status_code = 403
    elif isinstance(error, ValidationError):
        status_code = 400
    elif isinstance(error, HTTPException):
        status_code = error.code
    else:
        # For unexpected errors, use 500 status code and a generic message
        status_code = 500
        error_message = "An internal server error occurred"
        log_security_event('auth_error', {
            'error_type': error.__class__.__name__,
            'error_message': str(error),
            'status_code': status_code,
            'ip_address': get_request_ip()
        }, level='error')
        return jsonify({
            'error': {
                'message': error_message,
                'details': {}
            }
        }), status_code
    
    # For expected errors, use the actual error message
    error_message = str(error)
    error_details = {}
    
    # Include validation errors if available
    if isinstance(error, ValidationError) and hasattr(error, 'errors'):
        error_details = error.errors
    
    # Log the error
    log_security_event('auth_error', {
        'error_type': error.__class__.__name__,
        'error_message': error_message,
        'status_code': status_code,
        'ip_address': get_request_ip()
    }, level='warning')
    
    # Return formatted error response
    return jsonify({
        'error': {
            'message': error_message,
            'details': error_details
        }
    }), status_code