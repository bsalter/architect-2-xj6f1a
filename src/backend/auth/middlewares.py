"""
Authentication and authorization middleware for the Interaction Management System.

Implements JWT token validation, site context enforcement, and protection for routes
requiring authentication. These middleware components ensure proper user authentication
and apply site-scoping to enforce data access boundaries.
"""

from functools import wraps
from typing import Callable

from flask import request, g, abort, Flask  # version 2.3.2

# Internal imports
from .utils import validate_auth_token, get_token_from_request, get_user_from_token, get_site_context
from ..utils.security import log_security_event, get_request_ip
from ..utils.logging import logger

# Routes that don't require authentication
PUBLIC_ROUTES = ['auth.login', 'auth.logout', 'auth.request_password_reset', 'auth.reset_password']


def auth_middleware():
    """
    Global middleware to validate JWT tokens and set user/site context.
    
    This middleware runs before each request to verify authentication and establish
    the user and site context. Routes listed in PUBLIC_ROUTES bypass authentication.
    """
    # Skip token validation for public routes
    if request.endpoint in PUBLIC_ROUTES:
        logger.info(f"Accessing public route: {request.endpoint}")
        return
    
    # Extract token from request headers or cookies
    token = get_token_from_request()
    
    # If token not found for protected route, abort with 401 Unauthorized
    if not token:
        logger.warning(f"No authentication token provided for protected route: {request.endpoint}")
        abort(401, description="Authentication required")
    
    # Validate token and get payload
    token_data = validate_auth_token(token)
    
    # If token invalid for protected route, abort with 401 Unauthorized
    if not token_data:
        logger.warning(f"Invalid token for protected route: {request.endpoint}")
        log_security_event('invalid_token_access', {
            'endpoint': request.endpoint,
            'ip_address': get_request_ip()
        }, level='warning')
        abort(401, description="Invalid or expired authentication token")
    
    # Get user from database based on token payload
    user = get_user_from_token(token_data)
    
    # If user not found or inactive for protected route, abort with 401 Unauthorized
    if not user or not user.is_active:
        logger.warning(f"User not found or inactive for token")
        log_security_event('invalid_user_access', {
            'endpoint': request.endpoint,
            'user_id': token_data.get('sub'),
            'ip_address': get_request_ip()
        }, level='warning')
        abort(401, description="User not found or inactive")
    
    # Get site context from token and request parameters
    # Check if a specific site_id is requested
    requested_site_id = request.args.get('site_id')
    if requested_site_id:
        try:
            requested_site_id = int(requested_site_id)
        except (ValueError, TypeError):
            requested_site_id = None
    
    site_context = get_site_context(token_data, requested_site_id)
    
    # If site context invalid for protected route, abort with 403 Forbidden
    if not site_context:
        logger.warning(f"Invalid site context for user")
        log_security_event('invalid_site_access', {
            'endpoint': request.endpoint,
            'user_id': user.id,
            'requested_site': requested_site_id,
            'ip_address': get_request_ip()
        }, level='warning')
        abort(403, description="Invalid site context or access denied")
    
    # Set user and site context in flask.g for the current request
    g.user = user
    g.site_context = site_context
    
    # Log successful authentication
    logger.info(f"Authenticated user: {user.id}, site: {site_context['id']}")


def require_auth(f: Callable) -> Callable:
    """
    Decorator for routes that require authentication.
    
    Args:
        f: The route function to decorate
        
    Returns:
        Wrapped function that checks authentication before execution
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if g.user is set (authentication successful)
        if not hasattr(g, 'user') or not g.user:
            logger.warning(f"Authentication required for: {request.endpoint}")
            abort(401, description="Authentication required")
        
        # Execute the wrapped function if authenticated
        return f(*args, **kwargs)
    
    return decorated_function


def require_site_context(f: Callable) -> Callable:
    """
    Decorator for routes that require valid site context.
    
    Args:
        f: The route function to decorate
        
    Returns:
        Wrapped function that checks site context before execution
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if g.site_context is set (valid site context)
        if not hasattr(g, 'site_context') or not g.site_context:
            logger.warning(f"Site context required for: {request.endpoint}")
            abort(403, description="Valid site context required")
        
        # Execute the wrapped function if site context valid
        return f(*args, **kwargs)
    
    return decorated_function


def site_scoping_middleware():
    """
    Middleware to enforce site-scoping on database queries.
    
    This middleware applies the site_id filter to all database queries
    to ensure data isolation between sites.
    """
    # Skip site scoping for public routes
    if request.endpoint in PUBLIC_ROUTES:
        return
    
    # Verify site context is set in g
    if not hasattr(g, 'site_context') or not g.site_context:
        # For non-public routes without site context, we skip rather than abort
        # since auth_middleware would have already aborted if necessary
        return
    
    # Apply site_id filter to database query context
    site_id = g.site_context['id']
    if hasattr(g, 'query_context'):
        g.query_context['site_id'] = site_id
    else:
        g.query_context = {'site_id': site_id}
    
    # Log site scoping application
    logger.debug(f"Applied site scoping filter for site_id: {site_id}")


def register_middlewares(app: Flask) -> None:
    """
    Registers all auth middlewares with a Flask application.
    
    Args:
        app: The Flask application instance
    """
    # Register auth_middleware with app.before_request
    app.before_request(auth_middleware)
    
    # Register site_scoping_middleware with app.before_request
    app.before_request(site_scoping_middleware)
    
    # Log middleware registration
    logger.info("Registered authentication and site-scoping middlewares")