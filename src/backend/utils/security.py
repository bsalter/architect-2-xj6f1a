"""
Security utilities for the Interaction Management System.

This module provides security-related functionality including:
- Password hashing and verification
- JWT token generation and validation
- CSRF protection
- Security headers configuration
- Security event logging
- Input sanitization
"""

# Standard library imports
import re
import secrets
import hmac
import datetime
from typing import Dict, Any, List, Optional, Tuple, Union, Callable

# Third-party imports
import bcrypt  # version 4.0.1
import jwt  # version 2.8.0
from flask import request, session, current_app, g, Response  # version 2.3.2
from werkzeug.utils import escape  # version 2.3.6
from werkzeug.exceptions import Forbidden

# Internal imports
from .logging import logger, create_structured_log

# Constants
PASSWORD_MIN_LENGTH = 8
PASSWORD_REGEX = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
JWT_ALGORITHM = 'RS256'
JWT_EXPIRATION_HOURS = 24
SECURE_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block'
}


def hash_password(password: str) -> str:
    """Creates a secure hash of a password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        Hashed password string
    """
    # Ensure the password is in bytes format
    if isinstance(password, str):
        password_bytes = password.encode('utf-8')
    else:
        password_bytes = password
    
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return the hashed password as a string
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a password against a stored hash using bcrypt.
    
    Args:
        password: The plain text password to verify
        hashed_password: The stored password hash
        
    Returns:
        True if password matches hash, False otherwise
    """
    # Ensure inputs are in bytes format
    if isinstance(password, str):
        password_bytes = password.encode('utf-8')
    else:
        password_bytes = password
        
    if isinstance(hashed_password, str):
        hashed_password_bytes = hashed_password.encode('utf-8')
    else:
        hashed_password_bytes = hashed_password
    
    # Use bcrypt to check the password
    return bcrypt.checkpw(password_bytes, hashed_password_bytes)


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """Validates password against complexity requirements.
    
    Args:
        password: The password to validate
        
    Returns:
        Tuple of (bool, str) - (True, 'Password is valid') if valid, (False, error_message) if invalid
    """
    # Check password length
    if len(password) < PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {PASSWORD_MIN_LENGTH} characters long"
    
    # Check password complexity using regex
    if not re.match(PASSWORD_REGEX, password):
        return False, "Password must include uppercase, lowercase, number, and special character"
    
    return True, "Password is valid"


def generate_token(payload: Dict[str, Any], secret_key: str, expiration_hours: int = JWT_EXPIRATION_HOURS) -> str:
    """Generates a JWT token with provided payload and expiration.
    
    Args:
        payload: Dictionary containing data to include in the token
        secret_key: Secret key used for signing the token
        expiration_hours: Hours until token expiration (default: JWT_EXPIRATION_HOURS)
        
    Returns:
        JWT token string
    """
    # Create a copy of the payload to avoid modifying the original
    token_payload = payload.copy()
    
    # Add standard JWT claims
    now = datetime.datetime.utcnow()
    token_payload.update({
        'exp': now + datetime.timedelta(hours=expiration_hours),  # Expiration time
        'iat': now,  # Issued at time
        'jti': secrets.token_hex(16)  # Unique token ID
    })
    
    # Create and return the token
    token = jwt.encode(token_payload, secret_key, algorithm=JWT_ALGORITHM)
    
    return token


def decode_token(token: str, secret_key: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token.
    
    Args:
        token: JWT token string to decode
        secret_key: Secret key used for validating the token signature
        
    Returns:
        Decoded token payload if valid, None if invalid
    """
    try:
        # Decode and validate the token
        payload = jwt.decode(token, secret_key, algorithms=[JWT_ALGORITHM])
        
        # Verify required claims
        if not all(claim in payload for claim in ['exp', 'iat', 'jti']):
            logger.warning("Token missing required claims", extra={'token_id': payload.get('jti')})
            return None
            
        return payload
        
    except jwt.ExpiredSignatureError:
        # Token has expired
        logger.warning("Expired token used", extra={'token': token[:10] + '...'})
        return None
        
    except jwt.InvalidTokenError as e:
        # Token is invalid for some other reason
        logger.error(f"Invalid token: {str(e)}", extra={'token': token[:10] + '...'})
        return None


def generate_reset_token() -> str:
    """Generates a secure token for password reset.
    
    Returns:
        Secure random token string
    """
    # Generate a URL-safe secure token
    return secrets.token_urlsafe(32)


def log_security_event(event_type: str, details: Dict[str, Any], level: str = 'info') -> None:
    """Logs security-related events with standardized format.
    
    Args:
        event_type: Type of security event (e.g., 'login_attempt', 'password_change')
        details: Dictionary of event-specific details
        level: Log level (info, warning, error)
    """
    # Create a message from the event type
    message = f"Security event: {event_type}"
    
    # Create a structured log with event details
    log_data = create_structured_log(
        message=message,
        extra_fields={
            'event_type': event_type,
            'security_event': True,
            **details
        },
        level=level.upper(),
        component='security'
    )
    
    # Log at the appropriate level
    if level.lower() == 'info':
        logger.info(message, extra=log_data)
    elif level.lower() == 'warning':
        logger.warning(message, extra=log_data)
    elif level.lower() == 'error':
        logger.error(message, extra=log_data)


def get_request_ip() -> str:
    """Gets the client IP address from the request.
    
    Returns:
        Client IP address string
    """
    # Check for X-Forwarded-For header if behind a proxy
    if request.headers.get('X-Forwarded-For'):
        # X-Forwarded-For can contain multiple IPs; get the first one (client IP)
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    
    # Fall back to remote_addr
    return request.remote_addr or '0.0.0.0'


def generate_csrf_token() -> str:
    """Generates a CSRF token for form protection.
    
    Returns:
        CSRF token string
    """
    # Generate a random token
    token = secrets.token_hex(16)
    
    # Store in session for later validation
    session['csrf_token'] = token
    
    return token


def validate_csrf_token(token: str) -> bool:
    """Validates a CSRF token against the stored token.
    
    Args:
        token: The token to validate
        
    Returns:
        True if token is valid, False otherwise
    """
    # Get the stored token
    stored_token = session.get('csrf_token')
    
    # If no token is stored, validation fails
    if not stored_token:
        return False
    
    # Use constant-time comparison to prevent timing attacks
    return hmac.compare_digest(stored_token, token)


def set_secure_headers(response: Response) -> Response:
    """Sets secure HTTP headers on a Flask response.
    
    Args:
        response: The Flask response object
        
    Returns:
        Response with security headers added
    """
    # Add standard security headers
    for header, value in SECURE_HEADERS.items():
        response.headers[header] = value
    
    # Add Content-Security-Policy header
    csp_value = "default-src 'self'; " \
                "script-src 'self' 'unsafe-inline'; " \
                "style-src 'self' 'unsafe-inline'; " \
                "img-src 'self' data:; " \
                "connect-src 'self'"
    response.headers['Content-Security-Policy'] = csp_value
    
    # Add Strict-Transport-Security header
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response


def sanitize_input(input_string: str) -> str:
    """Sanitizes user input to prevent injection attacks.
    
    Args:
        input_string: The user input to sanitize
        
    Returns:
        Sanitized input string
    """
    # Escape HTML special characters
    sanitized = escape(input_string)
    
    # Remove potentially dangerous patterns
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'data:', '', sanitized, flags=re.IGNORECASE)
    
    return sanitized


class CSRFProtect:
    """Class for CSRF protection middleware."""
    
    def __init__(self, app=None):
        """Initialize CSRF protection for a Flask app.
        
        Args:
            app: Flask application to initialize with
        """
        self.app = app
        self.exempt_routes = []
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize CSRF protection for the Flask app.
        
        Args:
            app: Flask application to initialize
        """
        self.app = app
        
        # Register before_request handler for CSRF validation
        app.before_request(self.validate_csrf)
        
        # Register after_request handler to add CSRF token to responses
        @app.after_request
        def add_csrf_token(response):
            # Generate a CSRF token if one doesn't exist
            if 'csrf_token' not in session:
                generate_csrf_token()
            return response
        
        # Register template context processor to provide CSRF token
        @app.context_processor
        def csrf_context():
            return {'csrf_token': session.get('csrf_token', generate_csrf_token())}
    
    def exempt(self, view_function):
        """Decorator to exempt a route from CSRF protection.
        
        Args:
            view_function: The Flask view function to exempt
            
        Returns:
            The same view function, now exempt from CSRF
        """
        # Add the endpoint name to exempt routes
        endpoint = self.app.view_functions.get(view_function.__name__, view_function).__name__
        self.exempt_routes.append(endpoint)
        return view_function
    
    def validate_csrf(self):
        """Validates CSRF token for request if required.
        
        Raises:
            Forbidden: If CSRF validation fails
        """
        # Skip validation for safe methods
        if request.method in ['GET', 'HEAD', 'OPTIONS', 'TRACE']:
            return
        
        # Skip validation for exempt routes
        if request.endpoint in self.exempt_routes:
            return
        
        # Get the CSRF token from form, headers, or cookies
        token = request.form.get('csrf_token')
        if not token:
            token = request.headers.get('X-CSRF-Token')
        if not token:
            token = request.cookies.get('csrf_token')
        
        # Validate the token
        if not token or not validate_csrf_token(token):
            log_security_event('csrf_validation_failed', {
                'endpoint': request.endpoint,
                'method': request.method,
                'ip_address': get_request_ip()
            }, level='warning')
            
            raise Forbidden("CSRF token validation failed")