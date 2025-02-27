import logging
import json
import os
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Union

# Flask imports - handling potential import errors gracefully 
# to make the logging module usable even in non-Flask contexts
try:
    from flask import request, has_request_context, g
except ImportError:
    # Create dummy functions when Flask is not available
    def has_request_context():
        return False
    
    class DummyObject:
        pass
    
    request = DummyObject()
    g = DummyObject()

# CloudWatch integration - handling potential import errors
try:
    import watchtower
    CLOUDWATCH_AVAILABLE = True
except ImportError:
    CLOUDWATCH_AVAILABLE = False

# Global constants
DEFAULT_FORMAT = "%(asctime)s [%(levelname)s] %(component)s: %(message)s"
DEFAULT_LOG_LEVEL = logging.INFO

# Map string log levels to logging module constants
LOG_LEVELS = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}


class JsonFormatter(logging.Formatter):
    """Custom log formatter that outputs logs in JSON format."""
    
    def __init__(self):
        """Initializes the JSON formatter."""
        super().__init__()
    
    def format(self, record: logging.LogRecord) -> str:
        """Formats the log record as a JSON string.
        
        Args:
            record: The log record to format
            
        Returns:
            JSON-formatted log string
        """
        log_data = {
            'timestamp': datetime.utcfromtimestamp(record.created).isoformat() + 'Z',
            'level': record.levelname,
            'message': record.getMessage(),
        }
        
        # Extract component name if available
        if hasattr(record, 'component'):
            log_data['component'] = record.component
        else:
            log_data['component'] = record.name
            
        # Add request context if available
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
            
        if hasattr(record, 'user_id') and record.user_id is not None:
            log_data['user_id'] = record.user_id
            
        if hasattr(record, 'site_id') and record.site_id is not None:
            log_data['site_id'] = record.site_id
        
        # Add exception info if available
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info)
            }
            
        # Add any extra fields from the record
        for key, value in record.__dict__.items():
            if key not in ('args', 'asctime', 'created', 'exc_info', 'exc_text', 
                          'filename', 'funcName', 'id', 'levelname', 'levelno',
                          'lineno', 'module', 'msecs', 'message', 'msg', 'name',
                          'pathname', 'process', 'processName', 'relativeCreated',
                          'stack_info', 'thread', 'threadName', 'request_id',
                          'user_id', 'site_id', 'component') and not key.startswith('_'):
                log_data[key] = value
                
        return json.dumps(log_data)


class RequestContextFilter(logging.Filter):
    """Log filter that adds request context information to log records."""
    
    def __init__(self):
        """Initializes the request context filter."""
        super().__init__()
        
    def filter(self, record: logging.LogRecord) -> bool:
        """Adds request context to the log record.
        
        Args:
            record: The log record to enhance
            
        Returns:
            True to include the record in output
        """
        record.request_id = get_request_id()
        record.user_id = get_user_id()
        record.site_id = get_site_id()
        
        return True


class CloudWatchHandler(logging.Handler):
    """Custom log handler that sends logs to AWS CloudWatch."""
    
    def __init__(self, log_group: str, log_stream: str, aws_credentials: Optional[Dict[str, str]] = None):
        """Initializes the CloudWatch handler with AWS configuration.
        
        Args:
            log_group: CloudWatch log group name
            log_stream: CloudWatch log stream name
            aws_credentials: Optional AWS credentials dictionary
        """
        super().__init__()
        
        if not CLOUDWATCH_AVAILABLE:
            raise ImportError("watchtower package is required for CloudWatch logging")
        
        # Configure AWS credentials if provided
        kwargs = {}
        if aws_credentials:
            kwargs.update({
                'aws_access_key_id': aws_credentials.get('aws_access_key_id'),
                'aws_secret_access_key': aws_credentials.get('aws_secret_access_key'),
                'region_name': aws_credentials.get('region_name', 'us-east-1')
            })
        
        # Create watchtower handler
        self.handler = watchtower.CloudWatchLogHandler(
            log_group=log_group,
            stream_name=log_stream,
            create_log_group=True,
            **kwargs
        )
        
        # Set formatter
        self.setFormatter(JsonFormatter())
    
    def emit(self, record: logging.LogRecord) -> None:
        """Sends a log record to CloudWatch.
        
        Args:
            record: The log record to send
        """
        try:
            # Format the record and send to CloudWatch
            formatted_record = self.format(record)
            self.handler.emit(record)
        except Exception as e:
            # Handle any AWS-related exceptions
            fallback_logger = logging.getLogger('fallback')
            fallback_logger.error(f"Failed to send log to CloudWatch: {str(e)}")
    
    def close(self) -> None:
        """Closes the handler and flushes any remaining logs."""
        try:
            self.handler.close()
        except Exception as e:
            fallback_logger = logging.getLogger('fallback')
            fallback_logger.error(f"Error closing CloudWatch handler: {str(e)}")
        finally:
            super().close()


def get_request_id() -> str:
    """Extracts or generates a request ID from the current Flask request context.
    
    Returns:
        Unique request identifier
    """
    if has_request_context():
        # Try to get from request headers
        if hasattr(request, 'headers') and request.headers.get('X-Request-ID'):
            return request.headers.get('X-Request-ID')
            
        # Check if already set in request object
        if hasattr(request, 'request_id'):
            return request.request_id
    
    # Generate new UUID if no existing request ID
    return str(uuid.uuid4())


def get_user_id() -> Optional[Union[str, int]]:
    """Extracts the user ID from the current request context if authenticated.
    
    Returns:
        User ID if authenticated user is present, None otherwise
    """
    if has_request_context():
        # Check if current_user is available from flask-login
        if hasattr(g, 'current_user') and hasattr(g.current_user, 'id'):
            return g.current_user.id
        
        # Alternative: check JWT claims if using JWT authentication
        if hasattr(g, 'jwt_claims') and g.jwt_claims.get('sub'):
            return g.jwt_claims.get('sub')
    
    return None


def get_site_id() -> Optional[Union[str, int]]:
    """Extracts the site context ID from the current request.
    
    Returns:
        Site ID if site context is available, None otherwise
    """
    if has_request_context():
        # Check if site_id is in request context
        if hasattr(g, 'site_id'):
            return g.site_id
        
        # Check if site context is in request object
        if hasattr(request, 'site_context') and hasattr(request.site_context, 'id'):
            return request.site_context.id
        
        # Check if in JWT claims
        if hasattr(g, 'jwt_claims') and g.jwt_claims.get('site_id'):
            return g.jwt_claims.get('site_id')
    
    return None


def create_structured_log(
    message: str, 
    extra_fields: Optional[Dict[str, Any]] = None, 
    level: str = 'INFO', 
    component: str = 'app'
) -> Dict[str, Any]:
    """Creates a structured log entry with standardized fields.
    
    Args:
        message: The main log message
        extra_fields: Additional context fields to include
        level: Log level string (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        component: Name of the component/module generating the log
        
    Returns:
        Structured log entry with all required fields
    """
    # Create base log structure
    log_entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'level': level,
        'component': component,
        'message': message,
        'request_id': get_request_id()
    }
    
    # Add user_id if available
    user_id = get_user_id()
    if user_id is not None:
        log_entry['user_id'] = user_id
    
    # Add site_id if available
    site_id = get_site_id()
    if site_id is not None:
        log_entry['site_id'] = site_id
    
    # Add any extra fields
    if extra_fields:
        log_entry.update(extra_fields)
    
    return log_entry


def log_exception(exc: Exception, component: str = 'app', extra_fields: Optional[Dict[str, Any]] = None) -> None:
    """Logs an exception with detailed information and stack trace.
    
    Args:
        exc: The exception to log
        component: The component where the exception occurred
        extra_fields: Additional context fields to include
    """
    # Get logger
    logger = logging.getLogger(component)
    
    # Create extra context with exception details
    context = {
        'exception_type': exc.__class__.__name__,
        'exception_message': str(exc),
    }
    
    # Add traceback if available
    import traceback
    context['traceback'] = traceback.format_exc()
    
    # Add any additional context
    if extra_fields:
        context.update(extra_fields)
    
    # Log the error
    logger.error(f"Exception: {str(exc)}", extra={
        'component': component,
        **context
    })


def setup_logging(app_name: str, config: Optional[Dict[str, Any]] = None, use_cloudwatch: bool = False) -> logging.Logger:
    """Configures the logging system for the application.
    
    Args:
        app_name: Name of the application (used as logger name)
        config: Configuration dictionary with log settings
        use_cloudwatch: Whether to enable CloudWatch logging
        
    Returns:
        Configured logger instance
    """
    config = config or {}
    
    # Get log level from config or environment
    log_level_name = config.get('LOG_LEVEL') or os.environ.get('LOG_LEVEL', 'INFO')
    log_level = LOG_LEVELS.get(log_level_name, DEFAULT_LOG_LEVEL)
    
    # Create logger
    logger = logging.getLogger(app_name)
    logger.setLevel(log_level)
    
    # Clear existing handlers to avoid duplicates on reinitialization
    if logger.handlers:
        logger.handlers.clear()
    
    # Add request context filter
    logger.addFilter(RequestContextFilter())
    
    # Console handler with JSON formatting
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JsonFormatter())
    logger.addHandler(console_handler)
    
    # Add CloudWatch handler if enabled
    if use_cloudwatch:
        if not CLOUDWATCH_AVAILABLE:
            logger.warning("CloudWatch logging requested but watchtower package is not installed")
        else:
            try:
                # Get CloudWatch configuration
                log_group = config.get('LOG_GROUP', f"{app_name}-logs")
                log_stream = config.get('LOG_STREAM', f"{app_name}-{time.strftime('%Y-%m-%d')}")
                
                # Get AWS credentials from config or environment
                aws_credentials = config.get('AWS_CREDENTIALS', {})
                if not aws_credentials:
                    # Try to get from environment if not in config
                    aws_credentials = {
                        'aws_access_key_id': os.environ.get('AWS_ACCESS_KEY_ID'),
                        'aws_secret_access_key': os.environ.get('AWS_SECRET_ACCESS_KEY'),
                        'region_name': os.environ.get('AWS_REGION', 'us-east-1')
                    }
                
                # Create and add CloudWatch handler
                cloudwatch_handler = CloudWatchHandler(
                    log_group=log_group,
                    log_stream=log_stream,
                    aws_credentials=aws_credentials
                )
                logger.addHandler(cloudwatch_handler)
                logger.info(f"CloudWatch logging enabled with log group: {log_group}")
                
            except Exception as e:
                logger.error(f"Failed to initialize CloudWatch logging: {str(e)}")
    
    logger.info(f"Logging initialized for {app_name} at level {log_level_name}")
    return logger