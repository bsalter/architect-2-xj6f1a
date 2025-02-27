"""
Authentication service module for the Interaction Management System.

This module provides the AuthService class, which handles user authentication,
token management, and site-scoped access control.
"""

from datetime import datetime, timedelta
from flask import current_app
from werkzeug.exceptions import HTTPException, BadRequest, Unauthorized, Forbidden
import uuid

from ..auth.models import User, UserSite
from ..sites.models import Site
from ..extensions import db, jwt, redis_client
from ..utils.security import (
    hash_password, verify_password, validate_password_strength,
    generate_token, decode_token, log_security_event
)

# Constants
TOKEN_BLACKLIST_PREFIX = 'token:blacklist:'
RESET_TOKEN_PREFIX = 'reset_token:'
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 15 * 60  # 15 minutes in seconds


class AuthService:
    """
    Service class handling authentication, token management, and site-scoped access control.
    
    This service provides functionality for user authentication, JWT token generation and
    validation, site-scoped access control, and security operations like password management.
    It integrates with Redis for token blacklisting and account lockout tracking.
    """

    def login(self, username, password):
        """
        Authenticates a user and generates a JWT token.

        Args:
            username (str): The username to authenticate
            password (str): The password to verify

        Returns:
            dict: Authentication result with token and user information

        Raises:
            Unauthorized: If credentials are invalid or account is locked
            Forbidden: If user has no site associations
        """
        # Check if account is locked
        if self.is_account_locked(username):
            log_security_event('login_attempt', {
                'username': username,
                'success': False,
                'reason': 'account_locked'
            }, level='warning')
            raise Unauthorized('Account is temporarily locked due to too many failed attempts')

        # Find user by username
        user = User.query.filter_by(username=username).first()

        # Handle invalid username
        if not user:
            self.handle_failed_login(username)
            log_security_event('login_attempt', {
                'username': username,
                'success': False,
                'reason': 'user_not_found'
            }, level='warning')
            raise Unauthorized('Invalid username or password')

        # Verify password
        if not verify_password(password, user.password_hash):
            self.handle_failed_login(username)
            log_security_event('login_attempt', {
                'username': username,
                'success': False,
                'reason': 'invalid_password'
            }, level='warning')
            raise Unauthorized('Invalid username or password')

        # Reset failed login attempts
        self._reset_failed_login_attempts(username)

        # Update last login timestamp
        user.update_last_login()
        db.session.commit()

        # Get user's site associations
        site_ids = user.get_site_ids()
        if not site_ids:
            log_security_event('login_attempt', {
                'username': username,
                'user_id': user.id,
                'success': False,
                'reason': 'no_site_access'
            }, level='warning')
            raise Forbidden('User has no site access')

        # Get sites information
        sites = self.get_user_sites(user)

        # Generate JWT token with user_id and site_ids
        token_payload = {
            'sub': user.id,
            'sites': site_ids,
            'username': user.username
        }
        token = generate_token(token_payload, current_app.config['JWT_SECRET_KEY'])

        # Log successful login
        log_security_event('login_success', {
            'username': username,
            'user_id': user.id,
            'sites': site_ids
        })

        # Return authentication data
        return {
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'last_login': user.last_login.isoformat() if user.last_login else None
            },
            'sites': sites
        }

    def logout(self, token):
        """
        Invalidates a JWT token by adding it to the blacklist.

        Args:
            token (str): The JWT token to invalidate

        Returns:
            bool: True if logout successful

        Raises:
            BadRequest: If token cannot be decoded
        """
        try:
            # Decode token to get payload
            payload = decode_token(token, current_app.config['JWT_SECRET_KEY'])
            if not payload:
                raise BadRequest('Invalid token')

            # Get token unique identifier and expiration
            jti = payload.get('jti')
            exp = payload.get('exp')
            
            if not jti or not exp:
                raise BadRequest('Token missing required claims')

            # Calculate token TTL
            now = datetime.utcnow()
            expiration_datetime = datetime.fromtimestamp(exp)
            ttl = max(0, int((expiration_datetime - now).total_seconds()))

            # Add token to blacklist with expiration
            redis_client.set(f"{TOKEN_BLACKLIST_PREFIX}{jti}", "1", ex=ttl)

            # Log logout event
            log_security_event('logout', {
                'user_id': payload.get('sub'),
                'token_jti': jti
            })

            return True
        except Exception as e:
            log_security_event('logout_failed', {
                'error': str(e)
            }, level='error')
            raise BadRequest(f'Logout failed: {str(e)}')

    def get_current_user(self, token):
        """
        Retrieves user information from a JWT token.

        Args:
            token (str): JWT token

        Returns:
            User or None: User object if token is valid, None otherwise
        """
        try:
            # Decode and validate token
            payload = decode_token(token, current_app.config['JWT_SECRET_KEY'])
            if not payload:
                return None

            # Check if token is blacklisted
            jti = payload.get('jti')
            if jti and self.is_token_blacklisted(jti):
                return None

            # Get user from database
            user_id = payload.get('sub')
            if not user_id:
                return None

            return User.query.get(user_id)
        except Exception:
            return None

    def get_user_sites(self, user):
        """
        Gets all sites a user has access to.

        Args:
            user (User): User object

        Returns:
            list: List of sites the user has access to, with site details
        """
        # Query for UserSite entries for this user, joining with Site
        user_sites = (
            db.session.query(UserSite, Site)
            .join(Site, UserSite.site_id == Site.site_id)
            .filter(UserSite.user_id == user.id, Site.is_active == True)
            .all()
        )

        # Format site information
        sites = []
        for user_site, site in user_sites:
            sites.append({
                'id': site.site_id,
                'name': site.name,
                'role': user_site.role,
                'description': site.description
            })

        return sites

    def set_site_context(self, user, site_id):
        """
        Sets the active site context for a user.

        Args:
            user (User): User object
            site_id (int): Site ID to set as active

        Returns:
            dict: Site context information

        Raises:
            Forbidden: If user does not have access to the site
        """
        # Check if site exists
        site = Site.query.filter_by(site_id=site_id, is_active=True).first()
        if not site:
            raise Forbidden('Site not found or inactive')

        # Verify user has access to this site
        if not user.has_site_access(site_id):
            log_security_event('site_access_denied', {
                'user_id': user.id,
                'site_id': site_id
            }, level='warning')
            raise Forbidden('User does not have access to this site')

        # Get user's role for this site
        user_site = UserSite.query.filter_by(user_id=user.id, site_id=site_id).first()
        
        # Return site context
        return {
            'site_id': site.site_id,
            'name': site.name,
            'role': user_site.role if user_site else None
        }

    def create_user(self, user_data):
        """
        Creates a new user account.

        Args:
            user_data (dict): User information including username, email, password

        Returns:
            User: Created user object

        Raises:
            BadRequest: If required fields are missing or invalid
        """
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in user_data or not user_data[field]:
                raise BadRequest(f"Missing required field: {field}")

        username = user_data['username']
        email = user_data['email']
        password = user_data['password']

        # Check if username already exists
        if User.query.filter_by(username=username).first():
            raise BadRequest("Username already exists")

        # Check if email already exists
        if User.query.filter_by(email=email).first():
            raise BadRequest("Email already exists")

        # Validate password strength
        is_valid, message = validate_password_strength(password)
        if not is_valid:
            raise BadRequest(message)

        # Hash password
        password_hash = hash_password(password)

        # Create user
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            is_active=True
        )

        db.session.add(user)
        db.session.commit()

        # Log user creation
        log_security_event('user_created', {
            'user_id': user.id,
            'username': username,
            'email': email
        })

        return user

    def associate_user_with_site(self, user_id, site_id, role):
        """
        Associates a user with a site.

        Args:
            user_id (int): User ID
            site_id (int): Site ID
            role (str): User's role at the site

        Returns:
            UserSite: UserSite association object

        Raises:
            BadRequest: If user, site, or role is invalid
        """
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            raise BadRequest("User not found")

        # Check if site exists
        site = Site.query.get(site_id)
        if not site:
            raise BadRequest("Site not found")

        # Check if association already exists
        existing = UserSite.query.filter_by(user_id=user_id, site_id=site_id).first()
        if existing:
            existing.role = role  # Update role if association exists
            db.session.commit()
            
            log_security_event('user_site_role_updated', {
                'user_id': user_id,
                'site_id': site_id,
                'role': role
            })
            
            return existing

        # Create new association
        user_site = UserSite(
            user_id=user_id,
            site_id=site_id,
            role=role
        )

        db.session.add(user_site)
        db.session.commit()

        # Log association
        log_security_event('user_site_associated', {
            'user_id': user_id,
            'site_id': site_id,
            'role': role
        })

        return user_site

    def verify_site_access(self, user, site_id):
        """
        Verifies if a user has access to a specific site.

        Args:
            user (User): User object
            site_id (int): Site ID to check access for

        Returns:
            bool: True if user has access, False otherwise
        """
        return user.has_site_access(site_id)

    def is_token_blacklisted(self, jti):
        """
        Checks if a token is in the blacklist.

        Args:
            jti (str): Token identifier

        Returns:
            bool: True if token is blacklisted, False otherwise
        """
        return redis_client.get(f"{TOKEN_BLACKLIST_PREFIX}{jti}") is not None

    def change_password(self, user, current_password, new_password):
        """
        Changes a user's password after verifying current password.

        Args:
            user (User): User object
            current_password (str): Current password for verification
            new_password (str): New password to set

        Returns:
            bool: True if password changed successfully

        Raises:
            Unauthorized: If current password is invalid
            BadRequest: If new password is invalid
        """
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            log_security_event('password_change_failed', {
                'user_id': user.id,
                'reason': 'invalid_current_password'
            }, level='warning')
            raise Unauthorized("Current password is incorrect")

        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            raise BadRequest(message)

        # Hash new password
        new_password_hash = hash_password(new_password)

        # Update user's password
        user.password_hash = new_password_hash
        db.session.commit()

        # Log password change
        log_security_event('password_changed', {
            'user_id': user.id
        })

        return True

    def request_password_reset(self, email):
        """
        Initiates password reset by generating a reset token.

        Args:
            email (str): User's email address

        Returns:
            str or None: Reset token if user exists, None otherwise
        """
        # Find user by email
        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if email exists
            return None

        # Generate unique token
        reset_token = str(uuid.uuid4())

        # Store token in Redis with expiration (30 minutes)
        redis_client.set(
            f"{RESET_TOKEN_PREFIX}{reset_token}",
            str(user.id),
            ex=30 * 60  # 30 minutes
        )

        # Log password reset request
        log_security_event('password_reset_requested', {
            'user_id': user.id,
            'email': email
        })

        return reset_token

    def reset_password(self, token, new_password):
        """
        Completes password reset using a valid token.

        Args:
            token (str): Reset token
            new_password (str): New password to set

        Returns:
            bool: True if password reset successful

        Raises:
            BadRequest: If token is invalid or expired
        """
        # Validate token
        user_id = redis_client.get(f"{RESET_TOKEN_PREFIX}{token}")
        if not user_id:
            raise BadRequest("Invalid or expired token")

        # Get user
        user = User.query.get(int(user_id))
        if not user:
            raise BadRequest("User not found")

        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            raise BadRequest(message)

        # Hash new password
        new_password_hash = hash_password(new_password)

        # Update user's password
        user.password_hash = new_password_hash
        db.session.commit()

        # Delete used token
        redis_client.delete(f"{RESET_TOKEN_PREFIX}{token}")

        # Log password reset
        log_security_event('password_reset_completed', {
            'user_id': user.id
        })

        return True

    def handle_failed_login(self, username):
        """
        Tracks failed login attempts and implements account lockout.

        Args:
            username (str): Username that failed login

        Returns:
            bool: True if account is now locked, False otherwise
        """
        # Get current attempt count
        attempt_key = f"login_attempts:{username}"
        attempts_str = redis_client.get(attempt_key)
        attempts = int(attempts_str) if attempts_str else 0

        # Increment counter
        attempts += 1
        redis_client.set(attempt_key, str(attempts), ex=LOCKOUT_DURATION)

        # Check if account should be locked
        if attempts >= MAX_LOGIN_ATTEMPTS:
            # Set lock flag
            lock_key = f"account_locked:{username}"
            redis_client.set(lock_key, "1", ex=LOCKOUT_DURATION)
            
            # Log account lockout
            log_security_event('account_locked', {
                'username': username,
                'attempts': attempts,
                'duration_minutes': LOCKOUT_DURATION // 60
            }, level='warning')
            
            return True
        
        return False

    def is_account_locked(self, username):
        """
        Checks if an account is temporarily locked due to failed login attempts.

        Args:
            username (str): Username to check

        Returns:
            bool: True if account is locked, False otherwise
        """
        lock_key = f"account_locked:{username}"
        return redis_client.get(lock_key) is not None

    def _reset_failed_login_attempts(self, username):
        """
        Resets the failed login attempt counter for a username.

        Args:
            username (str): Username to reset attempts for
        """
        attempt_key = f"login_attempts:{username}"
        lock_key = f"account_locked:{username}"
        
        redis_client.delete(attempt_key)
        redis_client.delete(lock_key)