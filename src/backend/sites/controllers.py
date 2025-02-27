"""
Controller layer for site-related HTTP requests in the Interaction Management System.
Handles requests for site management operations, enforces authentication and authorization,
and provides site context management for the multi-tenant application.
"""

from flask import Blueprint, request, jsonify, g
import marshmallow  # version 3.20.1

from ..api.error_handlers import (
    AuthenticationError, AuthorizationError, ResourceNotFoundError, 
    ResourceConflictError, ValidationError
)
from ..auth.middlewares import require_auth, require_site_context
from ..utils.pagination import get_pagination_params, PaginatedResult
from ..utils.logging import logger
from .services import SiteService
from .schemas import (
    SiteSchema, SiteCreateSchema, SiteUpdateSchema, SiteListSchema, UserSiteSchema
)

# Create service and schema instances
site_service = SiteService()
site_schema = SiteSchema()
site_create_schema = SiteCreateSchema()
site_update_schema = SiteUpdateSchema()
site_list_schema = SiteListSchema()


@require_auth
def get_sites():
    """
    Retrieve a list of all sites with pagination support
    
    Returns:
        flask.Response: JSON response with paginated list of sites
    """
    # Extract pagination parameters from request.args
    page, page_size = get_pagination_params()
    
    # Call site_service.get_sites() with pagination parameters
    paginated_sites = site_service.get_sites({'page': page, 'page_size': page_size})
    
    # Serialize the paginated sites using site_list_schema.dump()
    result = site_list_schema.dump({
        'items': paginated_sites.items,
        'total': paginated_sites.total,
        'page': paginated_sites.page,
        'page_size': paginated_sites.page_size,
        'pages': paginated_sites.total_pages
    })
    
    logger.info(f"Retrieved {paginated_sites.total} sites", extra={
        'component': 'SiteController',
        'action': 'get_sites'
    })
    
    # Return JSON response with sites data and pagination metadata
    return jsonify(result)


@require_auth
def get_site(site_id):
    """
    Retrieve a single site by ID
    
    Args:
        site_id (int): ID of the site to retrieve
    
    Returns:
        flask.Response: JSON response with site details
    """
    # Call site_service.get_site_by_id(site_id)
    site = site_service.get_site_by_id(site_id)
    
    # If site is None, raise ResourceNotFoundError
    if site is None:
        logger.warning(f"Site not found: {site_id}", extra={
            'component': 'SiteController',
            'action': 'get_site'
        })
        raise ResourceNotFoundError(f"Site with ID {site_id} not found")
    
    # Check if the current user has access to the site
    if not site_service.verify_user_site_access(g.user.id, site_id):
        logger.warning(f"User {g.user.id} attempted to access unauthorized site: {site_id}", extra={
            'component': 'SiteController',
            'action': 'get_site'
        })
        raise AuthorizationError("You do not have access to this site")
    
    # Serialize the site data using site_schema.dump()
    site_data = site_schema.dump(site)
    
    logger.info(f"Retrieved site: {site_id}", extra={
        'component': 'SiteController',
        'action': 'get_site'
    })
    
    # Return JSON response with site details
    return jsonify(site_data)


@require_auth
def create_site():
    """
    Create a new site
    
    Returns:
        flask.Response: JSON response with created site details
    """
    # Extract site data from request.json
    site_data = request.json
    
    # Validate the data using site_create_schema.load()
    try:
        validated_data = site_create_schema.load(site_data)
    except marshmallow.ValidationError as e:
        # If validation fails, raise ValidationError
        errors = {field: str(msgs[0]) if isinstance(msgs, list) else str(msgs) 
                for field, msgs in e.messages.items()}
        logger.warning("Site creation validation failed", extra={
            'component': 'SiteController',
            'action': 'create_site',
            'errors': errors
        })
        raise ValidationError("Invalid site data", errors)
    
    try:
        # Call site_service.create_site() with validated data
        new_site = site_service.create_site(validated_data)
        
        # Also add the current user as an admin to the new site
        site_service.add_user_to_site(g.user.id, new_site.site_id, 'admin')
        
        # Serialize the created site using site_schema.dump()
        site_data = site_schema.dump(new_site)
        
        logger.info(f"Created new site: {new_site.name} (ID: {new_site.site_id})", extra={
            'component': 'SiteController',
            'action': 'create_site'
        })
        
        # Return JSON response with 201 status code and site details
        return jsonify(site_data), 201
        
    except ValueError as e:
        if "already exists" in str(e):
            raise ResourceConflictError(str(e))
        raise ValidationError(str(e))


@require_auth
@require_site_context
def update_site(site_id):
    """
    Update an existing site
    
    Args:
        site_id (int): ID of the site to update
    
    Returns:
        flask.Response: JSON response with updated site details
    """
    # Verify if the current user has admin access to the site
    if not site_service.is_user_site_admin(g.user.id, site_id):
        logger.warning(f"User {g.user.id} attempted to update site {site_id} without admin rights", extra={
            'component': 'SiteController',
            'action': 'update_site'
        })
        raise AuthorizationError("Only site administrators can update site details")
    
    # Extract site data from request.json
    site_data = request.json
    
    # Validate the data using site_update_schema.load()
    try:
        validated_data = site_update_schema.load(site_data)
    except marshmallow.ValidationError as e:
        # If validation fails, raise ValidationError
        errors = {field: str(msgs[0]) if isinstance(msgs, list) else str(msgs) 
                for field, msgs in e.messages.items()}
        logger.warning("Site update validation failed", extra={
            'component': 'SiteController',
            'action': 'update_site',
            'errors': errors
        })
        raise ValidationError("Invalid site data", errors)
    
    try:
        # Call site_service.update_site(site_id, validated_data)
        updated_site = site_service.update_site(site_id, validated_data)
        
        # If site is None (not found), raise ResourceNotFoundError
        if updated_site is None:
            logger.warning(f"Site not found for update: {site_id}", extra={
                'component': 'SiteController',
                'action': 'update_site'
            })
            raise ResourceNotFoundError(f"Site with ID {site_id} not found")
        
        # Serialize the updated site using site_schema.dump()
        site_data = site_schema.dump(updated_site)
        
        logger.info(f"Updated site: {updated_site.name} (ID: {site_id})", extra={
            'component': 'SiteController',
            'action': 'update_site'
        })
        
        # Return JSON response with updated site details
        return jsonify(site_data)
        
    except ValueError as e:
        if "already exists" in str(e):
            raise ResourceConflictError(str(e))
        raise ValidationError(str(e))


@require_auth
def delete_site(site_id):
    """
    Delete a site or mark it as inactive
    
    Args:
        site_id (int): ID of the site to delete
    
    Returns:
        flask.Response: JSON response with success message
    """
    # Verify if the current user has admin access to the site
    if not site_service.is_user_site_admin(g.user.id, site_id):
        logger.warning(f"User {g.user.id} attempted to delete site {site_id} without admin rights", extra={
            'component': 'SiteController',
            'action': 'delete_site'
        })
        raise AuthorizationError("Only site administrators can delete sites")
    
    # Extract hard_delete parameter from request (defaulting to False)
    hard_delete = request.args.get('hard_delete', 'false').lower() == 'true'
    
    # Call site_service.delete_site(site_id, hard_delete)
    result = site_service.delete_site(site_id, hard_delete)
    
    # If result is False (site not found), raise ResourceNotFoundError
    if not result:
        logger.warning(f"Site not found for deletion: {site_id}", extra={
            'component': 'SiteController',
            'action': 'delete_site'
        })
        raise ResourceNotFoundError(f"Site with ID {site_id} not found")
    
    logger.info(f"Site {site_id} {'deleted' if hard_delete else 'marked inactive'}", extra={
        'component': 'SiteController',
        'action': 'delete_site',
        'hard_delete': hard_delete
    })
    
    # Return JSON response with success message
    return jsonify({
        "success": True,
        "message": f"Site with ID {site_id} {'deleted' if hard_delete else 'marked as inactive'} successfully"
    })


@require_auth
def get_site_users(site_id):
    """
    Retrieve users associated with a site
    
    Args:
        site_id (int): ID of the site
    
    Returns:
        flask.Response: JSON response with list of users
    """
    # Verify if the current user has access to the site
    if not site_service.verify_user_site_access(g.user.id, site_id):
        logger.warning(f"User {g.user.id} attempted to access users for unauthorized site: {site_id}", extra={
            'component': 'SiteController',
            'action': 'get_site_users'
        })
        raise AuthorizationError("You do not have access to this site")
    
    # Extract pagination parameters from request.args
    page, page_size = get_pagination_params()
    
    # Call site_service.get_site_users(site_id, pagination_params)
    paginated_users = site_service.get_site_users(site_id, {'page': page, 'page_size': page_size})
    
    # If paginated result is empty due to site not found, raise ResourceNotFoundError
    if paginated_users.total == 0 and not site_service.get_site_by_id(site_id):
        logger.warning(f"Site not found for user listing: {site_id}", extra={
            'component': 'SiteController',
            'action': 'get_site_users'
        })
        raise ResourceNotFoundError(f"Site with ID {site_id} not found")
    
    # Format user list with roles
    user_list = []
    for user in paginated_users.items:
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': site_service.get_user_site_role(user.id, site_id)
        }
        user_list.append(user_data)
    
    # Create paginated response
    result = {
        'items': user_list,
        'total': paginated_users.total,
        'page': paginated_users.page,
        'page_size': paginated_users.page_size,
        'pages': paginated_users.total_pages
    }
    
    logger.info(f"Retrieved {paginated_users.total} users for site {site_id}", extra={
        'component': 'SiteController',
        'action': 'get_site_users'
    })
    
    # Return JSON response with users data and pagination metadata
    return jsonify(result)


@require_auth
def get_site_statistics(site_id):
    """
    Get usage statistics for a site
    
    Args:
        site_id (int): ID of the site
    
    Returns:
        flask.Response: JSON response with site statistics
    """
    # Verify if the current user has access to the site
    if not site_service.verify_user_site_access(g.user.id, site_id):
        logger.warning(f"User {g.user.id} attempted to access statistics for unauthorized site: {site_id}", extra={
            'component': 'SiteController',
            'action': 'get_site_statistics'
        })
        raise AuthorizationError("You do not have access to this site")
    
    # Call site_service.get_site_statistics(site_id)
    statistics = site_service.get_site_statistics(site_id)
    
    # If statistics are empty due to site not found, raise ResourceNotFoundError
    if not statistics.get('exists', False):
        logger.warning(f"Site not found for statistics: {site_id}", extra={
            'component': 'SiteController',
            'action': 'get_site_statistics'
        })
        raise ResourceNotFoundError(f"Site with ID {site_id} not found")
    
    logger.info(f"Retrieved statistics for site {site_id}", extra={
        'component': 'SiteController',
        'action': 'get_site_statistics'
    })
    
    # Return JSON response with site statistics
    return jsonify(statistics)


@require_auth
def get_user_sites():
    """
    Get all sites the current user has access to
    
    Returns:
        flask.Response: JSON response with list of user's sites
    """
    # Get current user ID from g.user.id
    user_id = g.user.id
    
    # Extract active_only parameter from request (defaulting to True)
    active_only = request.args.get('active_only', 'true').lower() == 'true'
    
    # Call site_service.get_user_sites(user_id, active_only)
    user_sites = site_service.get_user_sites(user_id, active_only)
    
    # Serialize the sites using site_schema.dump(many=True)
    sites_data = site_schema.dump(user_sites, many=True)
    
    logger.info(f"Retrieved {len(user_sites)} sites for user {user_id}", extra={
        'component': 'SiteController',
        'action': 'get_user_sites',
        'active_only': active_only
    })
    
    # Return JSON response with user's sites
    return jsonify({"sites": sites_data})


@require_auth
def set_active_site():
    """
    Set the active site context for the current user session
    
    Returns:
        flask.Response: JSON response with active site details
    """
    # Extract site_id from request.json
    data = request.json
    site_id = data.get('site_id')
    
    # If site_id is missing, raise ValidationError
    if site_id is None:
        logger.warning("Missing site_id in set_active_site request", extra={
            'component': 'SiteController',
            'action': 'set_active_site'
        })
        raise ValidationError("site_id is required", {'site_id': 'This field is required'})
    
    # Verify if site exists by calling site_service.get_site_by_id(site_id)
    site = site_service.get_site_by_id(site_id)
    if site is None:
        logger.warning(f"Site not found for setting active: {site_id}", extra={
            'component': 'SiteController',
            'action': 'set_active_site'
        })
        raise ResourceNotFoundError(f"Site with ID {site_id} not found")
    
    # Verify current user has access to the site
    if not site_service.verify_user_site_access(g.user.id, site_id):
        logger.warning(f"User {g.user.id} attempted to set unauthorized site as active: {site_id}", extra={
            'component': 'SiteController',
            'action': 'set_active_site'
        })
        raise AuthorizationError("You do not have access to this site")
    
    # Set the site context in the user's session
    g.site_context = {'id': site_id}
    
    # Serialize the active site using site_schema.dump()
    site_data = site_schema.dump(site)
    
    logger.info(f"Set active site to {site_id} for user {g.user.id}", extra={
        'component': 'SiteController',
        'action': 'set_active_site'
    })
    
    # Return JSON response with active site details
    return jsonify({
        'success': True,
        'active_site': site_data
    })