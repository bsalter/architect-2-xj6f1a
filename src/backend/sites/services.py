"""
Service layer for site-related functionality in the Interaction Management System,
implementing business logic for site management, user-site associations, and site-scoping authorization checks.
"""

from typing import List, Dict, Optional, Any
from datetime import datetime

from .repositories import SiteRepository
from .models import Site
from ..auth.models import User, UserSite
from ..utils.pagination import PaginatedResult
from ..utils.logging import logger

# Default role for users added to a site
DEFAULT_SITE_ROLE = "user"
# Admin role name for site administrators
ADMIN_ROLE = "admin"

# Default repository instance
site_repository = SiteRepository()


class SiteService:
    """
    Service class implementing business logic for site management and site-scoping authorization
    """
    
    def __init__(self, repository=None):
        """
        Initialize the SiteService with repository dependency
        
        Args:
            repository: SiteRepository instance for data access
        """
        # Store provided repository or use default
        self.repository = repository or site_repository
        # Use the provided logger for service operations
        self.logger = logger
    
    def get_sites(self, pagination_params: Dict = None, active_only: bool = True) -> PaginatedResult:
        """
        Retrieve a list of sites with pagination support
        
        Args:
            pagination_params: Dictionary with pagination parameters
            active_only: If True, return only active sites
        
        Returns:
            PaginatedResult: Paginated list of sites
        """
        return self.repository.get_all_sites(pagination_params, active_only)
    
    def get_site_by_id(self, site_id: int) -> Optional[Site]:
        """
        Retrieve a single site by ID
        
        Args:
            site_id: ID of the site to retrieve
        
        Returns:
            Site object if found, None otherwise
        """
        return self.repository.get_site_by_id(site_id)
    
    def get_site_by_name(self, name: str) -> Optional[Site]:
        """
        Retrieve a single site by name
        
        Args:
            name: Name of the site to retrieve
        
        Returns:
            Site object if found, None otherwise
        """
        return self.repository.get_site_by_name(name)
    
    def create_site(self, site_data: Dict) -> Site:
        """
        Create a new site
        
        Args:
            site_data: Dictionary containing site data
        
        Returns:
            Newly created site object
        
        Raises:
            ValueError: If required data is missing or invalid
        """
        # Validate required site data
        if not site_data.get('name'):
            raise ValueError("Site name is required")
            
        # Check if site with the same name already exists
        existing_site = self.repository.get_site_by_name(site_data.get('name'))
        if existing_site:
            raise ValueError(f"Site with name '{site_data.get('name')}' already exists")
        
        # Create the site
        site = self.repository.create_site(site_data)
        
        # Log site creation
        self.logger.info(
            f"Site created: {site.name} (ID: {site.site_id})",
            extra={"component": "SiteService", "action": "create_site"}
        )
        
        return site
    
    def update_site(self, site_id: int, site_data: Dict) -> Optional[Site]:
        """
        Update an existing site
        
        Args:
            site_id: ID of the site to update
            site_data: Dictionary containing updated site data
        
        Returns:
            Updated site object or None if site not found
        
        Raises:
            ValueError: If site name already exists
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            return None
        
        # If updating name, check if new name already exists
        if 'name' in site_data and site_data['name'] != site.name:
            existing_site = self.repository.get_site_by_name(site_data['name'])
            if existing_site and existing_site.site_id != site_id:
                raise ValueError(f"Site with name '{site_data['name']}' already exists")
        
        # Update the site
        updated_site = self.repository.update_site(site_id, site_data)
        
        # Log site update
        if updated_site:
            self.logger.info(
                f"Site updated: {updated_site.name} (ID: {updated_site.site_id})",
                extra={"component": "SiteService", "action": "update_site"}
            )
        
        return updated_site
    
    def delete_site(self, site_id: int, hard_delete: bool = False) -> bool:
        """
        Delete a site or mark it as inactive
        
        Args:
            site_id: ID of the site to delete
            hard_delete: If True, physically delete the site; if False, mark as inactive
        
        Returns:
            True if successful, False if site not found or cannot be deleted
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            return False
        
        # If hard delete, check if site has any associations
        if hard_delete:
            # Get users associated with this site
            users_result = self.repository.get_site_users(site_id)
            
            # Check if site has associated users
            if users_result.total > 0:
                self.logger.warning(
                    f"Cannot hard delete site {site.name} (ID: {site_id}) - has {users_result.total} associated users",
                    extra={"component": "SiteService", "action": "delete_site"}
                )
                return False
            
            # Also check if site has interactions
            if hasattr(site, 'interactions') and site.interactions.count() > 0:
                self.logger.warning(
                    f"Cannot hard delete site {site.name} (ID: {site_id}) - has associated interactions",
                    extra={"component": "SiteService", "action": "delete_site"}
                )
                return False
        
        # Delete the site
        result = self.repository.delete_site(site_id, hard_delete)
        
        # Log site deletion
        if result:
            action = "hard deleted" if hard_delete else "marked inactive"
            self.logger.info(
                f"Site {action}: {site.name} (ID: {site_id})",
                extra={"component": "SiteService", "action": "delete_site"}
            )
        
        return result
    
    def get_user_sites(self, user_id: int, active_only: bool = True) -> List[Site]:
        """
        Retrieve all sites associated with a specific user
        
        Args:
            user_id: ID of the user
            active_only: If True, return only active sites
        
        Returns:
            List of Site objects the user has access to
        """
        return self.repository.get_user_sites(user_id, active_only)
    
    def get_site_users(self, site_id: int, pagination_params: Dict = None) -> PaginatedResult:
        """
        Retrieve all users associated with a specific site
        
        Args:
            site_id: ID of the site
            pagination_params: Dictionary with pagination parameters
        
        Returns:
            PaginatedResult: Paginated list of users associated with the site
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            # Return empty result if site not found
            return PaginatedResult([], 0, 1, 0)
        
        return self.repository.get_site_users(site_id, pagination_params)
    
    def add_user_to_site(self, user_id: int, site_id: int, role: str = DEFAULT_SITE_ROLE) -> Optional[UserSite]:
        """
        Associate a user with a site
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            role: Role for the user at the site (default: user)
        
        Returns:
            New or existing user-site association
        
        Raises:
            ValueError: If site doesn't exist or role is invalid
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            raise ValueError(f"Site with ID {site_id} not found")
        
        # Validate role
        role = role.lower()
        if role not in [DEFAULT_SITE_ROLE, ADMIN_ROLE]:
            raise ValueError(f"Invalid role: {role}. Must be one of: {DEFAULT_SITE_ROLE}, {ADMIN_ROLE}")
        
        # Add user to site
        association = self.repository.add_user_to_site(user_id, site_id, role)
        
        # Log user-site association
        if association:
            self.logger.info(
                f"User (ID: {user_id}) added to site {site.name} (ID: {site_id}) with role: {role}",
                extra={"component": "SiteService", "action": "add_user_to_site"}
            )
        
        return association
    
    def remove_user_from_site(self, user_id: int, site_id: int) -> bool:
        """
        Remove a user's association with a site
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
        
        Returns:
            True if successful, False otherwise
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            return False
        
        # Check if user has admin role and if they're the last admin
        user_role = self.repository.get_user_role_for_site(user_id, site_id)
        if user_role == ADMIN_ROLE:
            admin_count = self.get_admin_count_for_site(site_id)
            if admin_count <= 1:
                self.logger.warning(
                    f"Cannot remove user (ID: {user_id}) from site {site.name} (ID: {site_id}) - last admin user",
                    extra={"component": "SiteService", "action": "remove_user_from_site"}
                )
                return False
        
        # Remove user from site
        result = self.repository.remove_user_from_site(user_id, site_id)
        
        # Log user removal
        if result:
            self.logger.info(
                f"User (ID: {user_id}) removed from site {site.name} (ID: {site_id})",
                extra={"component": "SiteService", "action": "remove_user_from_site"}
            )
        
        return result
    
    def update_user_site_role(self, user_id: int, site_id: int, new_role: str) -> Optional[UserSite]:
        """
        Update a user's role for a specific site
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
            new_role: New role for the user
        
        Returns:
            Updated user-site association or None if not found
        
        Raises:
            ValueError: If role is invalid or would leave site without admin
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            return None
        
        # Validate role
        new_role = new_role.lower()
        if new_role not in [DEFAULT_SITE_ROLE, ADMIN_ROLE]:
            raise ValueError(f"Invalid role: {new_role}. Must be one of: {DEFAULT_SITE_ROLE}, {ADMIN_ROLE}")
        
        # Check if changing from admin to user would leave site without admin
        current_role = self.repository.get_user_role_for_site(user_id, site_id)
        if current_role == ADMIN_ROLE and new_role != ADMIN_ROLE:
            admin_count = self.get_admin_count_for_site(site_id)
            if admin_count <= 1:
                raise ValueError("Cannot change role: this would leave the site without an admin user")
        
        # Update role
        association = self.repository.update_user_site_role(user_id, site_id, new_role)
        
        # Log role update
        if association:
            self.logger.info(
                f"User (ID: {user_id}) role updated to {new_role} for site {site.name} (ID: {site_id})",
                extra={"component": "SiteService", "action": "update_user_site_role"}
            )
        
        return association
    
    def verify_user_site_access(self, user_id: int, site_id: int) -> bool:
        """
        Verify a user has access to a specific site
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
        
        Returns:
            True if user has access, False otherwise
        """
        return self.repository.user_has_site_access(user_id, site_id)
    
    def get_user_site_role(self, user_id: int, site_id: int) -> Optional[str]:
        """
        Get a user's role for a specific site
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
        
        Returns:
            Role name if user has access, None otherwise
        """
        return self.repository.get_user_role_for_site(user_id, site_id)
    
    def get_site_statistics(self, site_id: int) -> Dict[str, Any]:
        """
        Get usage statistics for a site
        
        Args:
            site_id: ID of the site
        
        Returns:
            Dictionary of site statistics
        """
        # Check if site exists
        site = self.repository.get_site_by_id(site_id)
        if not site:
            return {
                "site_id": site_id,
                "exists": False,
                "user_count": 0,
                "interaction_count": 0
            }
        
        # Get users count
        users_result = self.repository.get_site_users(site_id)
        user_count = users_result.total
        
        # Get interactions count (using relationship from site model)
        interaction_count = site.interactions.count() if hasattr(site, 'interactions') else 0
        
        # Get most recent interaction date
        most_recent_interaction = None
        if hasattr(site, 'interactions') and interaction_count > 0:
            most_recent = site.interactions.order_by(site.interactions.property.mapper.class_.created_at.desc()).first()
            if most_recent:
                most_recent_interaction = most_recent.created_at.isoformat()
        
        return {
            "site_id": site_id,
            "name": site.name,
            "exists": True,
            "is_active": site.is_active,
            "user_count": user_count,
            "interaction_count": interaction_count,
            "most_recent_interaction": most_recent_interaction,
            "created_at": site.created_at.isoformat()
        }
    
    def is_user_site_admin(self, user_id: int, site_id: int) -> bool:
        """
        Check if a user has admin role for a specific site
        
        Args:
            user_id: ID of the user
            site_id: ID of the site
        
        Returns:
            True if user is a site admin, False otherwise
        """
        role = self.get_user_site_role(user_id, site_id)
        return role == ADMIN_ROLE
    
    def get_admin_count_for_site(self, site_id: int) -> int:
        """
        Count the number of admin users for a site
        
        Args:
            site_id: ID of the site
        
        Returns:
            Number of users with admin role for the site
        """
        # Get paginated users with their roles
        users_result = self.repository.get_site_users(site_id)
        
        # Count users with admin role
        admin_count = 0
        for user in users_result.items:
            role = self.repository.get_user_role_for_site(user.id, site_id)
            if role == ADMIN_ROLE:
                admin_count += 1
        
        return admin_count