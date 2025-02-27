"""
Central registration point for all API routes in the Interaction Management System.

This module defines the main API blueprint and registers all sub-blueprints
(auth, interactions, sites) with proper prefixes. It also registers rate limiting
and CORS configurations for API endpoints.
"""

from flask import Blueprint, jsonify  # version 2.3.2

# Internal imports
from ..utils.logging import logger
from ..auth.routes import auth_bp
from ..interactions.routes import interactions_bp
from ..sites.routes import sites_bp
from ..extensions import limiter

# Create the main API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/', methods=['GET'])
def api_index():
    """
    Simple endpoint that returns API version and status information.
    
    Returns:
        dict: JSON response with API information
    """
    return jsonify({
        'version': '1.0.0',
        'status': 'operational',
        'documentation': '/api/docs'
    })

def register_rate_limits():
    """
    Applies rate limiting to API endpoints based on their criticality.
    """
    # Apply stricter rate limits to authentication endpoints
    limiter.limit("10/minute")(auth_bp)
    
    # Apply standard rate limits to read operations
    limiter.limit("100/minute", methods=["GET"])(api_bp)
    
    # Apply moderate rate limits to write operations
    limiter.limit("30/minute", methods=["POST", "PUT", "DELETE"])(api_bp)
    
    # Configure exemptions for specific internal calls
    # limiter.exempt("/api/health")
    
    logger.info("Rate limits registered for API endpoints", extra={"component": "API"})

def register_api_routes(app):
    """
    Registers all API routes with the Flask application.
    
    Args:
        app (Flask): The Flask application instance
    """
    # Register authentication routes with prefix /auth
    # auth_bp already has url_prefix='/auth', so combined with api_bp prefix='/api'
    # the routes will be accessible at /api/auth/...
    api_bp.register_blueprint(auth_bp)
    
    # Register interactions routes with prefix /interactions
    api_bp.register_blueprint(interactions_bp, url_prefix='/interactions')
    
    # Register sites routes with prefix /sites
    api_bp.register_blueprint(sites_bp, url_prefix='/sites')
    
    # Register rate limits for API endpoints
    register_rate_limits()
    
    # Apply CORS policy to API endpoints
    # Note: Core CORS configuration is handled in extensions.py
    
    # Register the API blueprint with the Flask app
    app.register_blueprint(api_bp)
    
    logger.info("API routes registered successfully", extra={"component": "API"})