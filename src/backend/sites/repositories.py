"""
Repository module for Site entities, implementing database operations and queries for sites with proper site-scoping support.
Provides methods for managing site data and user-site relationships in the Interaction Management System.
"""

from datetime import datetime
from typing import List, Dict, Optional, Any

import sqlalchemy
from sqlalchemy import and_

from ..extensions import db
from .models import Site
from ..auth.models import User, UserSite
from ..utils.pagination import PaginatedResult, apply_pagination


class SiteRepository:
    """
    Repository class for managing Site entity database operations with site-scoping support.
    """
    
    def __init__(self):
        """Initialize the Site repository"""
        # Using db.session from the imported extensions
        pass
    
    def get_all_sites(self, pagination_params: Optional[Dict] = None, active_only: bool = True) -> PaginatedResult:
        """
        Retrieve all sites with optional pagination.
        
        Args:
            pagination_params: Dictionary containing pagination parameters (page, page_size)
            active_only: If True, return only active sites
            
        Returns:
            PaginatedResult: Paginated list of sites and total count
        """
        # Create base query
        query = db.session.query(Site)
        
        # Apply active filter if specified
        if active_only:
            query = query.filter(Site.is_active == True)
        
        # Order by name for consistent display
        query = query.order_by(Site.name)
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination if parameters provided
        if pagination_params:
            page = pagination_params.get('page', 1)
            page_size = pagination_params.get('page_size', 25)
            paginated_query = apply_pagination(query, page, page_size)
            items = paginated_query.all()
            return PaginatedResult(items, total, page, page_size)
        
        # Return all items if no pagination
        items = query.all()
        return PaginatedResult(items, total, 1, len(items))
    
    def get_site_by_id(self, site_id: int) -> Optional[Site]:
        """
        Retrieve a single site by its ID.
        
        Args:
            site_id: ID of the site to retrieve
            
        Returns:
            Site object if found, None otherwise
        """
        return db.session.query(Site).filter(Site.site_id == site_id).first()
    
    def get_site_by_name(self, name: str) -> Optional[Site]:
        """
        Retrieve a single site by its name.
        
        Args:
            name: Name of the site to retrieve
            
        Returns:
            Site object if found, None otherwise
        """
        return db.session.query(Site).filter(Site.name == name).first()
    
    def create_site(self, site_data: Dict) -> Site:
        """
        Create a new site in the database.
        
        Args:
            site_data: Dictionary containing site data (name, description, is_active)
            
        Returns:
            Newly created site object
        """
        # Create new site object
        site = Site(
            name=site_data.get('name'),
            description=site_data.get('description'),
            is_active=site_data.get('is_active', True)
        )
        
        # Add to database and commit
        db.session.add(site)
        db.session.commit()
        
        return site
    
    def update_site(self, site_id: int, site_data: Dict) -> Optional[Site]:
        """
        Update an existing site in the database.
        
        Args:
            site_id: ID of the site to update
            site_data: Dictionary containing updated site data
            
        Returns:
            Updated site object, or None if site not found
        """
        # Get site by ID
        site = self.get_site_by_id(site_id)
        
        # Return None if site not found
        if not site:
            return None
        
        # Update site attributes if provided in site_data
        if 'name' in site_data:
            site.name = site_data['name']
        
        if 'description' in site_data:
            site.description = site_data['description']
        
        if 'is_active' in site_data:
            site.is_active = site_data['is_active']
        
        # Commit changes
        db.session.commit()
        
        return site
    
    def delete_site(self, site_id: int, hard_delete: bool = False) -> bool:
        """
        Delete a site from the database (or mark as inactive).
        
        Args:
            site_id: ID of the site to delete
            hard_delete: If True, physically remove the site; if False, mark as inactive
            
        Returns:
            True if successful, False otherwise
        """
        # Get site by ID
        site = self.get_site_by_id(site_id)
        
        # Return False if site not found
        if not site:
            return False
        
        try:
            if hard_delete:
                # Physically delete the site (note: this may fail if there are related records)
                db.session.delete(site)
            else:
                # Soft delete by marking as inactive
                site.is_active = False
            
            # Commit changes
            db.session.commit()
            return True
        except Exception:
            # Rollback on error
            db.session.rollback()
            return False
    
    def get_user_sites(self, user_id: int, active_only: bool = True) -> List[Site]:
        """
        Retrieve all sites associated with a specific user.
        
        Args:
            user_id: ID of the user
            active_only: If True, return only active sites
            
        Returns:
            List of Site objects associated with the user
        """
        # Create query joining User, UserSite, and Site tables
        query = (
            db.session.query(Site)
            .join(UserSite, UserSite.site_id == Site.site_id)
            .filter(UserSite.user_id == user_id)
        )
        
        # Apply active filter if specified
        if active_only:
            query = query.filter(Site.is_active == True)
        
        # Order by site name
        query = query.order_by(Site.name)
        
        return query.all()
    
    def get_site_users(self, site_id: int, pagination_params: Optional[Dict] = None) -> PaginatedResult:
        """
        Retrieve all users associated with a specific site.
        
        Args:
            site_id: ID of the site
            pagination_params: Dictionary containing pagination parameters (page, page_size)
            
        Returns:
            PaginatedResult: Paginated list of users and total count
        """
        # Create query joining User and UserSite tables
        query = (
            db.session.query(User)
            .join(UserSite, UserSite.user_id == User.id)
            .filter(UserSite.site_id == site_id)
            .order_by(User.username)
        )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination if parameters provided
        if pagination_params:
            page = pagination_params.get('page', 1)
            page_size = pagination_params.get('page_size', 25)
            paginated_query = apply_pagination(query, page, page_size)
            items = paginated_query.all()
            return PaginatedResult(items, total, page, page_size)
        
        # Return all items if no pagination
        items = query.all()
        return PaginatedResult(items, total, 1, len(items))
    
    def add_user_to_site(self, user_id: int, site_id: int, role: str) -> Optional[UserSite]:
        """
        Associate a user with a site with a specific role.
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            role: Role of the user at the site
            
        Returns:
            Created user-site association object, or existing one if already present
        """
        # Check if the association already exists
        existing = (
            db.session.query(UserSite)
            .filter(and_(UserSite.user_id == user_id, UserSite.site_id == site_id))
            .first()
        )
        
        # Return existing association if found
        if existing:
            return existing
        
        try:
            # Create new user-site association
            user_site = UserSite(
                user_id=user_id,
                site_id=site_id,
                role=role
            )
            
            # Add to database and commit
            db.session.add(user_site)
            db.session.commit()
            
            return user_site
        except Exception:
            # Rollback on error
            db.session.rollback()
            return None
    
    def remove_user_from_site(self, user_id: int, site_id: int) -> bool:
        """
        Remove a user's association with a site.
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            
        Returns:
            True if successful, False otherwise
        """
        # Find the user-site association
        user_site = (
            db.session.query(UserSite)
            .filter(and_(UserSite.user_id == user_id, UserSite.site_id == site_id))
            .first()
        )
        
        # Return False if association not found
        if not user_site:
            return False
        
        try:
            # Delete the association
            db.session.delete(user_site)
            db.session.commit()
            return True
        except Exception:
            # Rollback on error
            db.session.rollback()
            return False
    
    def update_user_site_role(self, user_id: int, site_id: int, new_role: str) -> Optional[UserSite]:
        """
        Update a user's role for a specific site.
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            new_role: New role for the user
            
        Returns:
            Updated user-site association object, or None if association not found
        """
        # Find the user-site association
        user_site = (
            db.session.query(UserSite)
            .filter(and_(UserSite.user_id == user_id, UserSite.site_id == site_id))
            .first()
        )
        
        # Return None if association not found
        if not user_site:
            return None
        
        try:
            # Update the role
            user_site.role = new_role
            db.session.commit()
            return user_site
        except Exception:
            # Rollback on error
            db.session.rollback()
            return None
    
    def user_has_site_access(self, user_id: int, site_id: int) -> bool:
        """
        Check if a user has access to a specific site.
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            
        Returns:
            True if user has access, False otherwise
        """
        # Count user-site associations
        count = (
            db.session.query(UserSite)
            .filter(and_(UserSite.user_id == user_id, UserSite.site_id == site_id))
            .count()
        )
        
        return count > 0
    
    def get_user_role_for_site(self, user_id: int, site_id: int) -> Optional[str]:
        """
        Get a user's role for a specific site.
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            
        Returns:
            Role name if user has access, None otherwise
        """
        # Find the user-site association
        user_site = (
            db.session.query(UserSite)
            .filter(and_(UserSite.user_id == user_id, UserSite.site_id == site_id))
            .first()
        )
        
        # Return None if association not found
        if not user_site:
            return None
        
        return user_site.role