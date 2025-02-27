"""
Authentication package initialization for the Interaction Management System.

This module initializes the authentication package, configures JWT-based authentication
and site-scoping middleware, and exposes the auth Blueprint for API routing.
"""

from flask import Flask  # version 2.3.2

# Import authentication Blueprint
from .routes import auth_bp

# Import authentication middlewares and decorators
from .middlewares import require_auth, require_site_context, register_middlewares

# Import authentication utilities
from .utils import get_current_user, get_user_sites

# Import JWT manager from extensions
from ..extensions import jwt

def init_app(app: Flask) -> None:
    """
    Initializes the authentication module with the Flask application.
    
    Args:
        app: Flask application instance
    """
    # Register the auth Blueprint with the Flask application
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Register authentication and site-scoping middleware
    register_middlewares(app)
    
    # Set up JWT token user loader callback
    @jwt.user_lookup_loader
    def user_loader_callback(jwt_header, jwt_payload):
        """
        JWT callback to load user and site context from token.
        
        Args:
            jwt_header: JWT header information
            jwt_payload: JWT payload containing user and site data
            
        Returns:
            Dictionary with user and site context information
        """
        # Extract user_id from JWT payload
        user_id = jwt_payload.get('sub')
        if not user_id:
            return None
        
        # Get user from database
        from ..extensions import db
        from .models import User
        user = db.session.query(User).get(user_id)
        
        if not user or not user.is_active:
            return None
        
        # Extract site_id from JWT payload if present
        site_id = jwt_payload.get('site_id')
        
        # Verify user has access to the specified site
        if site_id is not None:
            if not user.has_site_access(site_id):
                return None
        else:
            # Use first available site if none specified
            site_ids = user.get_site_ids()
            if site_ids:
                site_id = site_ids[0]
            else:
                return None
        
        # Return dictionary with user and site context information
        return {
            'user': user,
            'site_id': site_id,
            'available_sites': user.get_site_ids()
        }

# Export all required components
__all__ = [
    'auth_bp',
    'init_app',
    'require_auth',
    'require_site_context',
    'get_current_user',
    'get_user_sites'
]