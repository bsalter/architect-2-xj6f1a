"""
Repository layer for the Interaction entity that handles database operations with site-scoping enforcement.

This module implements data access patterns for creating, retrieving, updating, and deleting 
interaction records while enforcing site-based access control to ensure data isolation.
"""

from datetime import datetime
from typing import Dict, List, Optional, Union, Any

from sqlalchemy import or_, and_, func, desc, asc

from ..extensions import db
from .models import Interaction
from ..utils.pagination import PaginatedResult
from ..api.error_handlers import ResourceNotFoundError, AuthorizationError
from ..utils.logging import logger
from ..utils.date_utils import get_date_range_filter, get_current_datetime

# Default values for pagination and sorting
DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 25
DEFAULT_SORT_FIELD = 'created_at'
DEFAULT_SORT_DIRECTION = 'desc'


class InteractionRepository:
    """
    Repository class for handling Interaction database operations with site-scoping enforcement.
    
    This class implements data access patterns for the Interaction entity, ensuring
    that all operations respect site-based access control boundaries for multi-tenancy.
    """
    
    def create(self, interaction_data: Dict[str, Any], site_id: int, user_id: int) -> Interaction:
        """
        Create a new interaction associated with the specified site.
        
        Args:
            interaction_data: Dictionary containing interaction fields
            site_id: ID of the site this interaction belongs to
            user_id: ID of the user creating the interaction
            
        Returns:
            The created interaction instance
        """
        try:
            # Create new Interaction instance
            interaction = Interaction(**interaction_data)
            
            # Set site association and audit information
            interaction.site_id = site_id
            interaction.created_by = user_id
            interaction.updated_by = user_id
            interaction.created_at = get_current_datetime()
            interaction.updated_at = get_current_datetime()
            
            # Add to database and commit
            db.session.add(interaction)
            db.session.commit()
            
            logger.info(
                f"Created interaction id={interaction.interaction_id}",
                extra={
                    "component": "InteractionRepository",
                    "site_id": site_id,
                    "user_id": user_id,
                    "interaction_id": interaction.interaction_id
                }
            )
            
            return interaction
            
        except Exception as e:
            # Rollback transaction on error
            db.session.rollback()
            logger.error(
                f"Error creating interaction: {str(e)}",
                extra={
                    "component": "InteractionRepository",
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            raise
    
    def get_by_id(self, interaction_id: int, allowed_site_ids: List[int]) -> Interaction:
        """
        Retrieve an interaction by ID with site-scoping.
        
        Args:
            interaction_id: ID of the interaction to retrieve
            allowed_site_ids: List of site IDs the user has access to
            
        Returns:
            The interaction if found and accessible
            
        Raises:
            ResourceNotFoundError: If interaction doesn't exist or is not in an allowed site
        """
        # Query interaction with site-scoping filter
        interaction = db.session.query(Interaction)\
            .filter(Interaction.interaction_id == interaction_id)\
            .filter(Interaction.site_id.in_(allowed_site_ids))\
            .first()
        
        if not interaction:
            logger.warning(
                f"Interaction id={interaction_id} not found or not accessible",
                extra={
                    "component": "InteractionRepository",
                    "interaction_id": interaction_id,
                    "allowed_site_ids": allowed_site_ids
                }
            )
            raise ResourceNotFoundError(resource_type="Interaction")
        
        logger.debug(
            f"Retrieved interaction id={interaction_id}",
            extra={
                "component": "InteractionRepository",
                "interaction_id": interaction_id,
                "site_id": interaction.site_id
            }
        )
        
        return interaction
    
    def update(self, interaction_id: int, interaction_data: Dict[str, Any], 
               allowed_site_ids: List[int], user_id: int) -> Interaction:
        """
        Update an existing interaction with site-scoping check.
        
        Args:
            interaction_id: ID of the interaction to update
            interaction_data: Dictionary containing updated field values
            allowed_site_ids: List of site IDs the user has access to
            user_id: ID of the user performing the update
            
        Returns:
            The updated interaction
            
        Raises:
            ResourceNotFoundError: If interaction doesn't exist or is not in an allowed site
        """
        # Get the interaction with site-scoping
        interaction = self.get_by_id(interaction_id, allowed_site_ids)
        
        try:
            # Update fields from the data dictionary
            for key, value in interaction_data.items():
                if hasattr(interaction, key):
                    setattr(interaction, key, value)
            
            # Update audit information
            interaction.updated_by = user_id
            interaction.updated_at = get_current_datetime()
            
            # Commit the changes
            db.session.commit()
            
            logger.info(
                f"Updated interaction id={interaction_id}",
                extra={
                    "component": "InteractionRepository",
                    "interaction_id": interaction_id,
                    "site_id": interaction.site_id,
                    "user_id": user_id
                }
            )
            
            return interaction
            
        except Exception as e:
            # Rollback transaction on error
            db.session.rollback()
            logger.error(
                f"Error updating interaction id={interaction_id}: {str(e)}",
                extra={
                    "component": "InteractionRepository",
                    "interaction_id": interaction_id,
                    "user_id": user_id
                }
            )
            raise
    
    def delete(self, interaction_id: int, allowed_site_ids: List[int]) -> bool:
        """
        Delete an interaction with site-scoping check.
        
        Args:
            interaction_id: ID of the interaction to delete
            allowed_site_ids: List of site IDs the user has access to
            
        Returns:
            True if deleted successfully
            
        Raises:
            ResourceNotFoundError: If interaction doesn't exist or is not in an allowed site
        """
        # Get the interaction with site-scoping
        interaction = self.get_by_id(interaction_id, allowed_site_ids)
        
        try:
            # Remove the interaction
            db.session.delete(interaction)
            db.session.commit()
            
            logger.info(
                f"Deleted interaction id={interaction_id}",
                extra={
                    "component": "InteractionRepository",
                    "interaction_id": interaction_id,
                    "site_id": interaction.site_id
                }
            )
            
            return True
            
        except Exception as e:
            # Rollback transaction on error
            db.session.rollback()
            logger.error(
                f"Error deleting interaction id={interaction_id}: {str(e)}",
                extra={
                    "component": "InteractionRepository",
                    "interaction_id": interaction_id
                }
            )
            raise
    
    def get_all(self, allowed_site_ids: List[int], page: int = DEFAULT_PAGE, 
                page_size: int = DEFAULT_PAGE_SIZE, sort_field: str = DEFAULT_SORT_FIELD, 
                sort_direction: str = DEFAULT_SORT_DIRECTION) -> PaginatedResult:
        """
        Get all interactions for allowed sites with pagination.
        
        Args:
            allowed_site_ids: List of site IDs the user has access to
            page: Page number to retrieve (1-based)
            page_size: Number of items per page
            sort_field: Field to sort by
            sort_direction: Sort direction ('asc' or 'desc')
            
        Returns:
            PaginatedResult containing interactions and pagination metadata
        """
        try:
            # Create base query with site-scoping
            query = db.session.query(Interaction)\
                .filter(Interaction.site_id.in_(allowed_site_ids))
            
            # Apply sorting
            sort_column = getattr(Interaction, sort_field, Interaction.created_at)
            if sort_direction.lower() == 'desc':
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Count total records for pagination
            total_count = query.count()
            
            # Apply pagination
            offset = (page - 1) * page_size
            paginated_query = query.offset(offset).limit(page_size)
            
            # Execute query
            interactions = paginated_query.all()
            
            # Convert to list of dictionaries for API response
            interaction_list = [interaction.to_dict() for interaction in interactions]
            
            logger.debug(
                f"Retrieved {len(interaction_list)} interactions (page {page}/{(total_count + page_size - 1) // page_size})",
                extra={
                    "component": "InteractionRepository",
                    "allowed_site_ids": allowed_site_ids,
                    "page": page,
                    "page_size": page_size,
                    "total_count": total_count
                }
            )
            
            return PaginatedResult(
                items=interaction_list,
                total=total_count,
                page=page,
                page_size=page_size
            )
            
        except Exception as e:
            logger.error(
                f"Error retrieving interactions: {str(e)}",
                extra={
                    "component": "InteractionRepository",
                    "allowed_site_ids": allowed_site_ids
                }
            )
            raise
    
    def search(self, allowed_site_ids: List[int], filters: Dict[str, Any] = None, 
               page: int = DEFAULT_PAGE, page_size: int = DEFAULT_PAGE_SIZE, 
               sort_field: str = DEFAULT_SORT_FIELD, 
               sort_direction: str = DEFAULT_SORT_DIRECTION) -> PaginatedResult:
        """
        Search interactions with filters, sorting, and pagination.
        
        Args:
            allowed_site_ids: List of site IDs the user has access to
            filters: Dictionary of search filters to apply
            page: Page number to retrieve (1-based)
            page_size: Number of items per page
            sort_field: Field to sort by
            sort_direction: Sort direction ('asc' or 'desc')
            
        Returns:
            PaginatedResult containing search results and pagination metadata
        """
        try:
            filters = filters or {}
            
            # Create base query with site-scoping
            query = db.session.query(Interaction)\
                .filter(Interaction.site_id.in_(allowed_site_ids))
            
            # Apply filters if provided
            if filters:
                # Title filter (partial match)
                if filters.get('title'):
                    query = query.filter(Interaction.title.ilike(f"%{filters['title']}%"))
                
                # Type filter (exact match)
                if filters.get('type'):
                    query = query.filter(Interaction.type == filters['type'])
                
                # Lead filter (partial match)
                if filters.get('lead'):
                    query = query.filter(Interaction.lead.ilike(f"%{filters['lead']}%"))
                
                # Date range filter
                if filters.get('start_datetime') or filters.get('end_datetime'):
                    date_filters = get_date_range_filter(
                        filters.get('start_datetime'),
                        filters.get('end_datetime'),
                        Interaction.start_datetime
                    )
                    for date_filter in date_filters:
                        query = query.filter(date_filter)
                
                # Timezone filter (exact match)
                if filters.get('timezone'):
                    query = query.filter(Interaction.timezone == filters['timezone'])
                
                # Location filter (partial match)
                if filters.get('location'):
                    query = query.filter(Interaction.location.ilike(f"%{filters['location']}%"))
                
                # Description and notes full text search
                if filters.get('description'):
                    query = query.filter(Interaction.description.ilike(f"%{filters['description']}%"))
                
                if filters.get('notes'):
                    query = query.filter(Interaction.notes.ilike(f"%{filters['notes']}%"))
                
                # Global search across multiple fields
                if filters.get('search'):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(
                        or_(
                            Interaction.title.ilike(search_term),
                            Interaction.lead.ilike(search_term),
                            Interaction.type.ilike(search_term),
                            Interaction.location.ilike(search_term),
                            Interaction.description.ilike(search_term),
                            Interaction.notes.ilike(search_term)
                        )
                    )
            
            # Apply sorting
            sort_column = getattr(Interaction, sort_field, Interaction.created_at)
            if sort_direction.lower() == 'desc':
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Count total records for pagination
            total_count = query.count()
            
            # Apply pagination
            offset = (page - 1) * page_size
            paginated_query = query.offset(offset).limit(page_size)
            
            # Execute query
            interactions = paginated_query.all()
            
            # Convert to list of dictionaries for API response
            interaction_list = [interaction.to_dict() for interaction in interactions]
            
            logger.debug(
                f"Search returned {len(interaction_list)} interactions (page {page}/{(total_count + page_size - 1) // page_size})",
                extra={
                    "component": "InteractionRepository",
                    "allowed_site_ids": allowed_site_ids,
                    "filters": filters,
                    "page": page,
                    "page_size": page_size,
                    "total_count": total_count
                }
            )
            
            return PaginatedResult(
                items=interaction_list,
                total=total_count,
                page=page,
                page_size=page_size
            )
            
        except Exception as e:
            logger.error(
                f"Error searching interactions: {str(e)}",
                extra={
                    "component": "InteractionRepository",
                    "allowed_site_ids": allowed_site_ids,
                    "filters": filters
                }
            )
            raise