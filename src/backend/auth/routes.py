"""
Authentication routes module for the Interaction Management System.

This module defines the Flask Blueprint for authentication endpoints,
including login, user info, site selection, and logout routes.
"""

from flask import Blueprint

# Import the controller class
from src.backend.auth.controllers import AuthController

# Create the authentication blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Initialize controller
auth_controller = AuthController()

@auth_bp.route('/login', methods=['POST'])
def route_login():
    """
    Authenticate a user and return a JWT token.
    
    Returns:
        Response: JWT token and user details if authentication successful
    """
    return auth_controller.login()

@auth_bp.route('/me', methods=['GET'])
def route_me():
    """
    Get information about the currently authenticated user.
    
    Returns:
        Response: User details including associated sites
    """
    return auth_controller.get_current_user()

@auth_bp.route('/sites', methods=['GET'])
def route_sites():
    """
    Get sites associated with the current user.
    
    Returns:
        Response: List of sites user has access to
    """
    return auth_controller.get_user_sites()

@auth_bp.route('/site', methods=['POST'])
def route_set_site():
    """
    Set the active site context for the current user.
    
    Returns:
        Response: Success response with current site details
    """
    return auth_controller.set_active_site()

@auth_bp.route('/logout', methods=['POST'])
def route_logout():
    """
    Logout the current user by invalidating their JWT token.
    
    Returns:
        Response: Success response for logout
    """
    return auth_controller.logout()