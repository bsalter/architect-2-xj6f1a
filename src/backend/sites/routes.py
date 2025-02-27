"""
Routes module for site-related operations in the Interaction Management System.

This module defines API routes for site-related operations, including listing sites,
retrieving site details, and managing site context. These routes implement the
site-scoping mechanism that is central to the application's multi-tenant
architecture.
"""

from flask import Blueprint, jsonify, request  # version 2.3.2
from flask_jwt_extended import jwt_required, get_jwt_identity  # version 4.5.2

from .controllers import SiteController
from ..auth.middlewares import site_access_required

# Create Blueprint for site routes
sites_bp = Blueprint('sites', __name__)

# Initialize site controller
site_controller = SiteController()


@sites_bp.route('/sites', methods=['GET'])
@jwt_required()
def get_sites():
    """
    Retrieve sites accessible to the current user.
    
    Returns:
        JSON response with list of sites
    """
    # Get current user ID from JWT token
    user_id = get_jwt_identity()
    
    # Retrieve sites accessible to the user
    sites = site_controller.get_sites(user_id)
    
    # Return success response with sites data
    return jsonify({
        'status': 'success',
        'data': {
            'sites': sites
        }
    })


@sites_bp.route('/sites/<int:site_id>', methods=['GET'])
@jwt_required()
@site_access_required
def get_site(site_id):
    """
    Retrieve details for a specific site by ID.
    
    Args:
        site_id (int): ID of the site to retrieve
    
    Returns:
        JSON response with site details
    """
    # Get current user ID from JWT token
    user_id = get_jwt_identity()
    
    # Retrieve the specified site
    site = site_controller.get_site(site_id, user_id)
    
    # Return success response with site details
    return jsonify({
        'status': 'success',
        'data': {
            'site': site
        }
    })


@sites_bp.route('/sites/<int:site_id>/users', methods=['GET'])
@jwt_required()
@site_access_required
def get_site_users(site_id):
    """
    Retrieve users associated with a specific site.
    
    Args:
        site_id (int): ID of the site
        
    Returns:
        JSON response with list of users associated with the site
    """
    # Retrieve users associated with the site
    users = site_controller.get_site_users(site_id)
    
    # Return success response with user data
    return jsonify({
        'status': 'success',
        'data': {
            'users': users
        }
    })


@sites_bp.route('/sites/active', methods=['POST'])
@jwt_required()
def set_active_site():
    """
    Set the active site context for the current user session.
    
    Request body should contain:
    {
        "site_id": <integer>
    }
    
    Returns:
        JSON response confirming the active site context
    """
    # Get current user ID from JWT token
    user_id = get_jwt_identity()
    
    # Extract site_id from request JSON data
    site_id = request.json.get('site_id')
    
    # Validate site_id is provided and is an integer
    if site_id is None or not isinstance(site_id, int):
        return jsonify({
            'status': 'error',
            'message': 'Valid site_id is required'
        }), 400
    
    try:
        # Set the active site context
        site = site_controller.set_active_site(user_id, site_id)
        
        # Return success response with the current site
        return jsonify({
            'status': 'success',
            'data': {
                'current_site': site
            }
        })
    except Exception as e:
        # Handle case where user doesn't have access to the site
        return jsonify({
            'status': 'error',
            'message': 'User does not have access to this site'
        }), 403