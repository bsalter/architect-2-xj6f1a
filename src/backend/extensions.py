"""
Extensions module for initializing and configuring Flask extensions.

This module initializes all Flask extensions used throughout the application, 
including database ORM, JWT authentication, migrations, serialization, CORS, 
caching, and rate limiting.
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy  # v3.0.5
from flask_migrate import Migrate  # v4.0.4
from flask_jwt_extended import JWTManager  # v4.5.2
from flask_cors import CORS  # v4.0.0
from flask_marshmallow import Marshmallow  # v0.15.0
from redis import Redis  # v4.6.0
from flask_limiter import Limiter  # v3.3.1
from flask_limiter.util import get_remote_address  # v3.3.1

# Initialize extension instances
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()
cors = CORS()
redis_client = Redis()
limiter = Limiter(key_func=get_remote_address)

def is_token_blacklisted(jwt_header: dict, jwt_payload: dict) -> bool:
    """
    Callback function to check if a JWT token is blacklisted.
    
    Args:
        jwt_header (dict): JWT header information
        jwt_payload (dict): JWT payload information containing token data
        
    Returns:
        bool: True if token is blacklisted, False otherwise
    """
    jti = jwt_payload['jti']
    token_in_redis = redis_client.get(f'token_blacklist:{jti}')
    return token_in_redis is not None

def init_app(app: Flask) -> None:
    """
    Initialize all Flask extensions with the provided application instance.
    
    Args:
        app (Flask): The Flask application instance
        
    Returns:
        None
    """
    # Initialize SQLAlchemy
    app.config.setdefault('SQLALCHEMY_TRACK_MODIFICATIONS', False)
    db.init_app(app)
    
    # Initialize Flask-Migrate
    migrate.init_app(app, db)
    
    # Initialize JWT Manager
    jwt.init_app(app)
    # Configure token blacklist loader
    jwt.token_in_blocklist_loader(is_token_blacklisted)
    
    # Initialize Marshmallow
    ma.init_app(app)
    
    # Initialize CORS
    # Default to allowing all origins in development, should be restricted in production
    allowed_origins = app.config.get('CORS_ALLOWED_ORIGINS', '*')
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})
    
    # Configure Redis client
    global redis_client
    redis_host = app.config.get('REDIS_HOST', 'localhost')
    redis_port = app.config.get('REDIS_PORT', 6379)
    redis_db = app.config.get('REDIS_DB', 0)
    redis_password = app.config.get('REDIS_PASSWORD', None)
    
    # Create a new Redis client with the application configuration
    redis_client = Redis(
        host=redis_host,
        port=redis_port,
        db=redis_db,
        password=redis_password,
        decode_responses=True
    )
    
    # Initialize rate limiter with Redis storage
    redis_uri = f"redis://{':' + redis_password + '@' if redis_password else ''}{redis_host}:{redis_port}/{redis_db}"
    limiter.storage_uri = redis_uri
    limiter.init_app(app)