"""
Utility functions for authentication and authorization in the Interaction Management System.

This module provides utilities for JWT token management, user authentication, 
and site-scoped access control, implementing the core security mechanisms
for the Interaction Management System.
"""

from typing import Dict, List, Optional, Union, Any
from datetime import datetime, timedelta
from flask import request, current_app, g

from .models import User
from ..utils.security import decode_token, generate_token, log_security_event
from ..utils.logging import logger
from ..extensions import db

# Global token blacklist to store invalidated tokens
TOKEN_BLACKLIST = set()

# Authentication header configuration
AUTH_HEADER_NAME = 'Authorization'
AUTH_HEADER_TYPE = 'Bearer'
TOKEN_LOCATION = ['headers', 'cookies']


def create_auth_token(user_id: int, site_ids: List[int], expiration_hours: int = 24) -> str:
    """
    Creates a JWT authentication token for a user with site access information.
    
    Args:
        user_id: The user's ID
        site_ids: List of site IDs the user has access to
        expiration_hours: Hours until token expiration (default: 24)
        
    Returns:
        JWT token string
    """
    # Create payload dictionary with user_id and site_ids
    payload = {
        'sub': user_id,
        'site_ids': site_ids
    }
    
    # Get JWT secret key from application config
    secret_key = current_app.config.get('JWT_SECRET_KEY')
    
    # Generate JWT token using generate_token from security utils
    token = generate_token(payload, secret_key, expiration_hours)
    
    # Log token creation event
    log_security_event('token_creation', {
        'user_id': user_id,
        'site_count': len(site_ids),
        'expiration_hours': expiration_hours
    })
    
    return token


def validate_auth_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a JWT token and extracts payload.
    
    Args:
        token: JWT token string to validate
        
    Returns:
        Token payload if valid, None if invalid
    """
    # Check if token is in blacklist, return None if blacklisted
    if token in TOKEN_BLACKLIST:
        logger.warning("Attempt to use blacklisted token", extra={
            'token_fragment': token[:10] + '...' if token else 'None',
        })
        return None
    
    # Get JWT secret key from application config
    secret_key = current_app.config.get('JWT_SECRET_KEY')
    
    # Decode token using decode_token from security utils
    payload = decode_token(token, secret_key)
    
    # Log token validation result
    if payload:
        logger.info("Token validation successful", extra={
            'user_id': payload.get('sub'),
            'token_id': payload.get('jti')
        })
    else:
        logger.warning("Token validation failed", extra={
            'token_fragment': token[:10] + '...' if token else 'None',
        })
    
    # Return decoded payload if valid, None if invalid
    return payload


def invalidate_token(token: str) -> bool:
    """
    Blacklists a token to prevent its future use.
    
    Args:
        token: JWT token string to blacklist
        
    Returns:
        True if token was blacklisted, False if already blacklisted
    """
    # Check if token is already in blacklist
    if token in TOKEN_BLACKLIST:
        return False
    
    # Add token to TOKEN_BLACKLIST set
    TOKEN_BLACKLIST.add(token)
    
    # Log token invalidation event
    log_security_event('token_invalidation', {
        'token_fragment': token[:10] + '...' if token else 'None',
    })
    
    # Return True if newly blacklisted
    return True


def get_token_from_request() -> Optional[str]:
    """
    Extracts JWT token from request headers or cookies.
    
    Returns:
        Token string if found, None otherwise
    """
    token = None
    
    # Try to get token from Authorization header
    if 'headers' in TOKEN_LOCATION and AUTH_HEADER_NAME in request.headers:
        auth_header = request.headers.get(AUTH_HEADER_NAME)
        if auth_header and auth_header.startswith(f"{AUTH_HEADER_TYPE} "):
            token = auth_header.replace(f"{AUTH_HEADER_TYPE} ", "")
    
    # If not found in header, try to get from cookies
    if not token and 'cookies' in TOKEN_LOCATION:
        token = request.cookies.get('access_token')
    
    return token


def get_user_from_token(token_data: Dict[str, Any]) -> Optional[User]:
    """
    Gets User object from database based on token payload.
    
    Args:
        token_data: Token payload dictionary
        
    Returns:
        User object if found, None otherwise
    """
    # Extract user_id from token_data
    user_id = token_data.get('sub')
    if not user_id:
        logger.warning("Token missing user ID (sub claim)")
        return None
    
    # Query User model from database by user_id
    try:
        user = db.session.query(User).filter_by(id=user_id).first()
        return user
    except Exception as e:
        logger.error(f"Error retrieving user from database: {str(e)}")
        return None


def get_site_context(token_data: Dict[str, Any], site_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """
    Gets site context information from token or parameters.
    
    Args:
        token_data: Token payload dictionary
        site_id: Optional specific site ID to use
        
    Returns:
        Site context information if available, None otherwise
    """
    # Extract site_ids from token_data
    site_ids = token_data.get('site_ids', [])
    if not site_ids:
        logger.warning("Token contains no site IDs", extra={
            'user_id': token_data.get('sub')
        })
        return None
    
    # If specific site_id is provided, verify it's in user's site_ids
    if site_id is not None:
        if site_id in site_ids:
            return {
                'id': site_id,
                'available_sites': site_ids
            }
        else:
            logger.warning("Requested site not in user's allowed sites", extra={
                'requested_site': site_id,
                'allowed_sites': site_ids,
                'user_id': token_data.get('sub')
            })
            return None
    
    # If not provided, use first site_id from token as default
    return {
        'id': site_ids[0],
        'available_sites': site_ids
    }


def is_valid_site_for_user(user: User, site_id: int) -> bool:
    """
    Checks if a site is in the user's allowed sites.
    
    Args:
        user: User object
        site_id: Site ID to check
        
    Returns:
        True if site is valid for user, False otherwise
    """
    # Use user.has_site_access method to check permission
    return user.has_site_access(site_id)


def get_default_site_for_user(user: User) -> Optional[int]:
    """
    Gets the default site for a user.
    
    Args:
        user: User object
        
    Returns:
        ID of default site if available, None otherwise
    """
    # Get user's site IDs using get_site_ids method
    site_ids = user.get_site_ids()
    
    # Return first site ID if available, None otherwise
    if site_ids:
        return site_ids[0]
    return None


def record_login_attempt(username: str, success: bool, ip_address: str) -> None:
    """
    Records a user login attempt for security monitoring.
    
    Args:
        username: Username used in login attempt
        success: Whether the login was successful
        ip_address: IP address of the request
    """
    # Create login attempt record with timestamp
    timestamp = datetime.utcnow()
    
    # Log security event for the login attempt
    log_level = 'info' if success else 'warning'
    log_security_event('login_attempt', {
        'username': username,
        'success': success,
        'ip_address': ip_address,
        'timestamp': timestamp.isoformat()
    }, level=log_level)
    
    # Log using standard logger too
    if success:
        logger.info(f"Successful login for user: {username}", extra={
            'username': username,
            'ip_address': ip_address
        })
    else:
        logger.warning(f"Failed login attempt for user: {username}", extra={
            'username': username,
            'ip_address': ip_address
        })


def check_login_attempts(username: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
    """
    Checks if an account is locked due to too many failed login attempts.
    
    Args:
        username: Username to check
        max_attempts: Maximum allowed failed attempts before lockout
        window_minutes: Time window to check for attempts in minutes
        
    Returns:
        True if account is locked, False otherwise
    """
    # Calculate cutoff time based on window_minutes
    cutoff_time = datetime.utcnow() - timedelta(minutes=window_minutes)
    
    try:
        # Count failed login attempts since cutoff time
        result = db.session.execute(
            """
            SELECT COUNT(*) 
            FROM login_attempts 
            WHERE username = :username 
              AND success = false 
              AND timestamp > :cutoff_time
            """,
            {
                'username': username,
                'cutoff_time': cutoff_time
            }
        ).fetchone()
        
        failed_attempts = result[0] if result else 0
        
        # If account is locked, log a security event
        if failed_attempts >= max_attempts:
            log_security_event('account_locked', {
                'username': username,
                'failed_attempts': failed_attempts,
                'window_minutes': window_minutes,
                'cutoff_time': cutoff_time.isoformat()
            }, level='warning')
            
            logger.warning(f"Account locked for user: {username} due to {failed_attempts} failed attempts")
        
        # Return True if count exceeds max_attempts, False otherwise
        return failed_attempts >= max_attempts
        
    except Exception as e:
        # Log the error and return False to prevent unintentional lockouts
        logger.error(f"Error checking login attempts for {username}: {str(e)}")
        return False