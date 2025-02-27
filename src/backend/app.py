"""
Flask application factory that creates and configures the main backend application instance
for the Interaction Management System. This file serves as the central entry point for the backend,
initializing all required components, registering routes, and configuring middleware.
"""

import os
from flask import Flask

# Internal imports
from .config import get_config
from .extensions import db, migrate, jwt, cors, limiter, redis_client, init_app
from .api.routes import register_api_routes, api_bp
from .api.error_handlers import register_error_handlers
from .auth.middlewares import register_middlewares
from .utils.logging import logger


def create_app(config_class=None):
    """
    Application factory function that creates and configures a Flask application instance.
    
    Args:
        config_class: Configuration class to use for the application
        
    Returns:
        Flask application instance
    """
    # Create new Flask application instance
    app = Flask(__name__)
    
    # Load configuration from config_class parameter with default from get_config()
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)
    
    # Configure logging based on app configuration
    app_env = app.config.get('ENV', 'production')
    use_cloudwatch = app.config.get('CLOUDWATCH_ENABLED', False)
    
    # Initialize all extensions (db, migrate, jwt, cors, etc.) with init_app(app)
    init_app(app)
    
    # Register authentication and site-scoping middlewares with register_middlewares(app)
    register_middlewares(app)
    
    # Register all API routes with register_api_routes(app)
    register_api_routes(app)
    
    # Register standardized error handlers with register_error_handlers(app)
    register_error_handlers(app)
    
    # Configure additional application settings based on environment
    if app_env == 'development':
        # Enable more verbose logging in development
        app.config['PROPAGATE_EXCEPTIONS'] = True
    
    # Log successful application creation
    logger.info(
        f"Application created with {app_env} configuration",
        extra={"component": "app", "environment": app_env}
    )
    
    return app