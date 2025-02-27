import os
from datetime import datetime, timedelta

# Base directory path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def get_env_variable(key, default=None):
    """
    Retrieves an environment variable or returns a default value if not set.
    
    Args:
        key (str): Name of the environment variable
        default (any): Default value to return if environment variable is not set
        
    Returns:
        Value of the environment variable or the default value
    """
    return os.environ.get(key, default)

class Config:
    """Base configuration class with common settings for the Flask application."""
    
    # Flask settings
    ENV = 'production'
    DEBUG = False
    TESTING = False
    SECRET_KEY = get_env_variable('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database settings
    SQLALCHEMY_DATABASE_URI = get_env_variable('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/interactions')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_POOL_SIZE = int(get_env_variable('SQLALCHEMY_POOL_SIZE', '10'))
    SQLALCHEMY_POOL_TIMEOUT = int(get_env_variable('SQLALCHEMY_POOL_TIMEOUT', '30'))
    SQLALCHEMY_MAX_OVERFLOW = int(get_env_variable('SQLALCHEMY_MAX_OVERFLOW', '20'))
    
    # PgBouncer connection pooling
    PGBOUNCER_URI = get_env_variable('PGBOUNCER_URI', None)
    
    # Redis cache settings
    REDIS_URL = get_env_variable('REDIS_URL', 'redis://localhost:6379/0')
    REDIS_TTL_DEFAULT = int(get_env_variable('REDIS_TTL_DEFAULT', '300'))  # 5 minutes
    REDIS_TTL_AUTH = int(get_env_variable('REDIS_TTL_AUTH', '86400'))  # 24 hours
    REDIS_TTL_SEARCH = int(get_env_variable('REDIS_TTL_SEARCH', '300'))  # 5 minutes
    
    # Auth0 configuration
    AUTH0_DOMAIN = get_env_variable('AUTH0_DOMAIN', 'your-tenant.auth0.com')
    AUTH0_API_AUDIENCE = get_env_variable('AUTH0_API_AUDIENCE', 'https://api.interactions')
    AUTH0_ALGORITHMS = get_env_variable('AUTH0_ALGORITHMS', 'RS256')
    AUTH0_ISSUER = get_env_variable('AUTH0_ISSUER', 'https://your-tenant.auth0.com/')
    
    # JWT configuration
    JWT_SECRET_KEY = get_env_variable('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = int(get_env_variable('JWT_ACCESS_TOKEN_EXPIRES', str(24 * 60 * 60)))  # 24 hours
    JWT_TOKEN_LOCATION = ['headers']
    
    # CORS settings
    CORS_ORIGINS = get_env_variable('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Pagination
    ITEMS_PER_PAGE = int(get_env_variable('ITEMS_PER_PAGE', '25'))
    
    # Logging configuration
    LOG_LEVEL = get_env_variable('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # CloudWatch logging
    CLOUDWATCH_ENABLED = get_env_variable('CLOUDWATCH_ENABLED', 'False').lower() == 'true'
    CLOUDWATCH_LOG_GROUP = get_env_variable('CLOUDWATCH_LOG_GROUP', '/interactions/api')
    CLOUDWATCH_LOG_STREAM = get_env_variable('CLOUDWATCH_LOG_STREAM', datetime.now().strftime('%Y/%m/%d'))
    
    # Site-scoping for multi-tenancy
    SITE_SCOPING_ENABLED = True
    DEFAULT_SITE_SELECTION = True  # Automatically select first available site if user has only one
    
    # Rate limiting
    RATE_LIMITING_ENABLED = get_env_variable('RATE_LIMITING_ENABLED', 'True').lower() == 'true'
    RATE_LIMIT_DEFAULT = int(get_env_variable('RATE_LIMIT_DEFAULT', '100'))  # requests per minute
    RATE_LIMIT_AUTH = int(get_env_variable('RATE_LIMIT_AUTH', '10'))  # auth attempts per minute
    RATE_LIMIT_WRITE = int(get_env_variable('RATE_LIMIT_WRITE', '30'))  # write operations per minute
    
    # Email settings (SendGrid)
    SENDGRID_API_KEY = get_env_variable('SENDGRID_API_KEY', '')
    SENDGRID_DEFAULT_SENDER = get_env_variable('SENDGRID_DEFAULT_SENDER', 'noreply@interactions.com')


class DevelopmentConfig(Config):
    """Configuration for development environment with debugging enabled and relaxed security."""
    
    ENV = 'development'
    DEBUG = True
    
    # Use local development database
    SQLALCHEMY_DATABASE_URI = get_env_variable('DEV_DATABASE_URL', 
                                           'postgresql://postgres:postgres@localhost:5432/interactions_dev')
    
    # Use local Redis instance
    REDIS_URL = get_env_variable('DEV_REDIS_URL', 'redis://localhost:6379/0')
    
    # Allow all origins for CORS in development
    CORS_ORIGINS = ['*']
    
    # Disable CloudWatch in development
    CLOUDWATCH_ENABLED = False
    
    # Extend JWT token expiration for development convenience
    JWT_ACCESS_TOKEN_EXPIRES = int(get_env_variable('DEV_JWT_TOKEN_EXPIRES', str(7 * 24 * 60 * 60)))  # 7 days


class TestingConfig(Config):
    """Configuration for testing environment with test database and mocked services."""
    
    ENV = 'testing'
    TESTING = True
    DEBUG = True
    
    # Use in-memory SQLite for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Use fake Redis URL for testing
    REDIS_URL = 'redis://localhost:6379/9'  # Use a separate Redis DB for testing
    
    # Disable CloudWatch in testing
    CLOUDWATCH_ENABLED = False
    
    # For testing we can disable site scoping if needed for certain tests
    SITE_SCOPING_ENABLED = get_env_variable('TEST_SITE_SCOPING_ENABLED', 'True').lower() == 'true'


class StagingConfig(Config):
    """Configuration for staging environment, similar to production but with potential adjustments for testing."""
    
    ENV = 'staging'
    DEBUG = False
    
    # Use staging database
    SQLALCHEMY_DATABASE_URI = get_env_variable('STAGING_DATABASE_URL', 
                                           'postgresql://postgres:postgres@localhost:5432/interactions_staging')
    
    # Use staging Redis instance
    REDIS_URL = get_env_variable('STAGING_REDIS_URL', 'redis://localhost:6379/1')
    
    # Restrict CORS to staging domains
    CORS_ORIGINS = get_env_variable('STAGING_CORS_ORIGINS', 
                                'https://staging.interactions.com').split(',')
    
    # Enable CloudWatch in staging
    CLOUDWATCH_ENABLED = True


class ProductionConfig(Config):
    """Configuration for production environment with optimized settings for performance and security."""
    
    ENV = 'production'
    DEBUG = False
    
    # Database settings for production
    SQLALCHEMY_DATABASE_URI = get_env_variable('PRODUCTION_DATABASE_URL')
    PGBOUNCER_URI = get_env_variable('PRODUCTION_PGBOUNCER_URI')  # Use PgBouncer in production
    
    # Production Redis instance
    REDIS_URL = get_env_variable('PRODUCTION_REDIS_URL')
    
    # Optimize connection pool settings for production
    SQLALCHEMY_POOL_SIZE = int(get_env_variable('PRODUCTION_POOL_SIZE', '20'))
    SQLALCHEMY_POOL_TIMEOUT = int(get_env_variable('PRODUCTION_POOL_TIMEOUT', '30'))
    SQLALCHEMY_MAX_OVERFLOW = int(get_env_variable('PRODUCTION_MAX_OVERFLOW', '40'))
    
    # Restrict CORS to production domains
    CORS_ORIGINS = get_env_variable('PRODUCTION_CORS_ORIGINS', 
                                'https://interactions.com').split(',')
    
    # Standard token expiration for production
    JWT_ACCESS_TOKEN_EXPIRES = int(get_env_variable('PRODUCTION_JWT_TOKEN_EXPIRES', str(24 * 60 * 60)))  # 24 hours
    
    # Enable CloudWatch in production
    CLOUDWATCH_ENABLED = True
    
    # Enable rate limiting in production
    RATE_LIMITING_ENABLED = True


# Configuration dictionary mapping environment names to configuration classes
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}


def get_config():
    """
    Returns the appropriate configuration class based on the environment.
    
    Returns:
        Config class: Configuration class instance based on current environment
    """
    env = get_env_variable('FLASK_ENV', 'production')
    return config.get(env, config['default'])