"""
Service layer for interaction management implementing business logic for creating, retrieving, 
updating, and deleting interactions with site-scoping enforcement. This layer acts as an intermediary 
between controllers and repositories, providing a clean separation of concerns.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from .repositories import InteractionRepository
from .models import Interaction
from ..utils.validators import INTERACTION_TYPES, validate_interaction, ValidationError
from ..utils.date_utils import validate_date_range
from ..utils.pagination import PaginatedResult
from ..api.error_handlers import ResourceNotFoundError, AuthorizationError
from ..utils.logging import logger

# Default pagination and sorting values
DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 25
DEFAULT_SORT_FIELD = 'created_at'
DEFAULT_SORT_DIRECTION = 'desc'


class InteractionService:
    """
    Service class implementing business logic for interaction management with site-scoping.
    
    This class handles all interaction-related operations and enforces business rules
    while delegating data access to the repository layer. It ensures site-scoping 
    is applied to all operations for data security.
    """
    
    def __init__(self):
        """Initialize the service with repository dependency."""
        self.repository = InteractionRepository()
    
    def get_by_id(self, interaction_id: int, site_id: int) -> Interaction:
        """
        Retrieve an interaction by ID with site-scoping.
        
        Args:
            interaction_id: ID of the interaction to retrieve
            site_id: ID of the site to scope access to
        
        Returns:
            The interaction if found and accessible
            
        Raises:
            ResourceNotFoundError: If interaction doesn't exist or is not in allowed site
        """
        # Validate input parameters
        if not interaction_id or not isinstance(interaction_id, int) or interaction_id <= 0:
            raise ValueError("Valid interaction_id is required")
        
        # Validate site access and get list of allowed site IDs
        allowed_site_ids = self._validate_site_access(site_id)
        
        # Call repository to get the interaction with site-scoping
        try:
            interaction = self.repository.get_by_id(interaction_id, allowed_site_ids)
            
            logger.debug(
                f"Retrieved interaction id={interaction_id}",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "site_id": site_id
                }
            )
            
            return interaction
        except ResourceNotFoundError:
            logger.warning(
                f"Interaction id={interaction_id} not found or not accessible",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "site_id": site_id
                }
            )
            raise
    
    def create(self, interaction_data: Dict[str, Any], site_id: int, user_id: int) -> Interaction:
        """
        Create a new interaction.
        
        Args:
            interaction_data: Dictionary containing interaction fields
            site_id: ID of the site this interaction belongs to
            user_id: ID of the user creating the interaction
        
        Returns:
            The created interaction
            
        Raises:
            ValidationError: If interaction data is invalid
            ValueError: If site_id or user_id is invalid
        """
        # Validate site_id and user_id
        if not site_id or not isinstance(site_id, int) or site_id <= 0:
            raise ValueError("Valid site_id is required")
        
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("Valid user_id is required")
        
        # Validate interaction data
        validation_errors = validate_interaction(interaction_data, is_creation=True)
        if validation_errors:
            logger.warning(
                "Validation failed for interaction creation",
                extra={
                    "component": "InteractionService",
                    "validation_errors": validation_errors,
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            raise ValidationError("Invalid interaction data", validation_errors)
        
        # Validate date range if both dates are provided
        start_datetime = interaction_data.get('start_datetime')
        end_datetime = interaction_data.get('end_datetime')
        timezone = interaction_data.get('timezone')
        
        if start_datetime and end_datetime and not validate_date_range(start_datetime, end_datetime, timezone):
            validation_errors = {"end_datetime": "End date/time must be after start date/time"}
            logger.warning(
                "Date validation failed for interaction creation",
                extra={
                    "component": "InteractionService",
                    "validation_errors": validation_errors,
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            raise ValidationError("Invalid date range", validation_errors)
        
        # Call repository to create the interaction
        interaction = self.repository.create(interaction_data, site_id, user_id)
        
        logger.info(
            f"Created interaction id={interaction.interaction_id}",
            extra={
                "component": "InteractionService",
                "interaction_id": interaction.interaction_id,
                "site_id": site_id,
                "user_id": user_id
            }
        )
        
        return interaction
    
    def update(self, interaction_id: int, interaction_data: Dict[str, Any], 
               site_id: int, user_id: int) -> Interaction:
        """
        Update an existing interaction with site-scoping.
        
        Args:
            interaction_id: ID of the interaction to update
            interaction_data: Dictionary containing updated field values
            site_id: ID of the site to scope access to
            user_id: ID of the user performing the update
        
        Returns:
            The updated interaction
            
        Raises:
            ResourceNotFoundError: If interaction doesn't exist or is not in allowed site
            ValidationError: If updated data is invalid
        """
        # Validate inputs
        if not interaction_id or not isinstance(interaction_id, int) or interaction_id <= 0:
            raise ValueError("Valid interaction_id is required")
        
        if not site_id or not isinstance(site_id, int) or site_id <= 0:
            raise ValueError("Valid site_id is required")
        
        if not user_id or not isinstance(user_id, int) or user_id <= 0:
            raise ValueError("Valid user_id is required")
        
        # Validate interaction data for update
        validation_errors = validate_interaction(interaction_data, is_creation=False)
        if validation_errors:
            logger.warning(
                "Validation failed for interaction update",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "validation_errors": validation_errors,
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            raise ValidationError("Invalid interaction data", validation_errors)
        
        # Validate date range if both dates are provided
        start_datetime = interaction_data.get('start_datetime')
        end_datetime = interaction_data.get('end_datetime')
        timezone = interaction_data.get('timezone')
        
        if start_datetime and end_datetime and not validate_date_range(start_datetime, end_datetime, timezone):
            validation_errors = {"end_datetime": "End date/time must be after start date/time"}
            logger.warning(
                "Date validation failed for interaction update",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "validation_errors": validation_errors,
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            raise ValidationError("Invalid date range", validation_errors)
        
        # Validate site access and get list of allowed site IDs
        allowed_site_ids = self._validate_site_access(site_id)
        
        # Call repository to update the interaction
        try:
            interaction = self.repository.update(interaction_id, interaction_data, allowed_site_ids, user_id)
            
            logger.info(
                f"Updated interaction id={interaction.interaction_id}",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction.interaction_id,
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            
            return interaction
        except ResourceNotFoundError:
            logger.warning(
                f"Interaction id={interaction_id} not found or not accessible for update",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "site_id": site_id,
                    "user_id": user_id
                }
            )
            raise
    
    def delete(self, interaction_id: int, site_id: int) -> bool:
        """
        Delete an interaction with site-scoping.
        
        Args:
            interaction_id: ID of the interaction to delete
            site_id: ID of the site to scope access to
        
        Returns:
            True if deleted successfully
            
        Raises:
            ResourceNotFoundError: If interaction doesn't exist or is not in allowed site
        """
        # Validate inputs
        if not interaction_id or not isinstance(interaction_id, int) or interaction_id <= 0:
            raise ValueError("Valid interaction_id is required")
        
        # Validate site access and get list of allowed site IDs
        allowed_site_ids = self._validate_site_access(site_id)
        
        # Call repository to delete the interaction
        try:
            result = self.repository.delete(interaction_id, allowed_site_ids)
            
            logger.info(
                f"Deleted interaction id={interaction_id}",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "site_id": site_id
                }
            )
            
            return result
        except ResourceNotFoundError:
            logger.warning(
                f"Interaction id={interaction_id} not found or not accessible for deletion",
                extra={
                    "component": "InteractionService",
                    "interaction_id": interaction_id,
                    "site_id": site_id
                }
            )
            raise
    
    def get_all(self, site_id: int, page: int = DEFAULT_PAGE, 
                page_size: int = DEFAULT_PAGE_SIZE, sort_field: str = DEFAULT_SORT_FIELD, 
                sort_direction: str = DEFAULT_SORT_DIRECTION) -> PaginatedResult:
        """
        Get all interactions for a site with pagination and sorting.
        
        Args:
            site_id: ID of the site to scope access to
            page: Page number (1-based)
            page_size: Number of items per page
            sort_field: Field to sort by
            sort_direction: Sort direction ('asc' or 'desc')
        
        Returns:
            PaginatedResult containing interactions and pagination metadata
            
        Raises:
            ValueError: If pagination parameters are invalid
        """
        # Validate pagination parameters
        if not page or not isinstance(page, int) or page <= 0:
            page = DEFAULT_PAGE
        
        if not page_size or not isinstance(page_size, int) or page_size <= 0:
            page_size = DEFAULT_PAGE_SIZE
        
        # Set default values for sort parameters if not provided
        if not sort_field:
            sort_field = DEFAULT_SORT_FIELD
        
        if not sort_direction or sort_direction.lower() not in ['asc', 'desc']:
            sort_direction = DEFAULT_SORT_DIRECTION
        
        # Validate site access and get list of allowed site IDs
        allowed_site_ids = self._validate_site_access(site_id)
        
        # Call repository to get interactions with pagination
        result = self.repository.get_all(
            allowed_site_ids, 
            page=page, 
            page_size=page_size, 
            sort_field=sort_field, 
            sort_direction=sort_direction
        )
        
        logger.info(
            f"Retrieved interactions for site id={site_id} (page {page}, {len(result.items)} items)",
            extra={
                "component": "InteractionService",
                "site_id": site_id,
                "page": page,
                "page_size": page_size,
                "total_items": result.total
            }
        )
        
        return result
    
    def search(self, site_id: int, filters: Dict[str, Any] = None, 
               page: int = DEFAULT_PAGE, page_size: int = DEFAULT_PAGE_SIZE, 
               sort_field: str = DEFAULT_SORT_FIELD, 
               sort_direction: str = DEFAULT_SORT_DIRECTION) -> PaginatedResult:
        """
        Search interactions with filters and site-scoping.
        
        Args:
            site_id: ID of the site to scope access to
            filters: Dictionary of search filters to apply
            page: Page number (1-based)
            page_size: Number of items per page
            sort_field: Field to sort by
            sort_direction: Sort direction ('asc' or 'desc')
        
        Returns:
            PaginatedResult containing search results and pagination metadata
            
        Raises:
            ValueError: If search parameters are invalid
        """
        # Default empty filters dictionary if None provided
        if filters is None:
            filters = {}
        
        # Validate filters
        if not isinstance(filters, dict):
            raise ValueError("Filters must be a dictionary")
        
        # Validate pagination parameters
        if not page or not isinstance(page, int) or page <= 0:
            page = DEFAULT_PAGE
        
        if not page_size or not isinstance(page_size, int) or page_size <= 0:
            page_size = DEFAULT_PAGE_SIZE
        
        # Set default values for sort parameters if not provided
        if not sort_field:
            sort_field = DEFAULT_SORT_FIELD
        
        if not sort_direction or sort_direction.lower() not in ['asc', 'desc']:
            sort_direction = DEFAULT_SORT_DIRECTION
        
        # Validate site access and get list of allowed site IDs
        allowed_site_ids = self._validate_site_access(site_id)
        
        # Call repository to search interactions
        result = self.repository.search(
            allowed_site_ids,
            filters=filters,
            page=page,
            page_size=page_size,
            sort_field=sort_field,
            sort_direction=sort_direction
        )
        
        logger.info(
            f"Searched interactions for site id={site_id} with {len(filters)} filters (found {result.total} items)",
            extra={
                "component": "InteractionService",
                "site_id": site_id,
                "filter_count": len(filters),
                "page": page,
                "page_size": page_size,
                "total_items": result.total
            }
        )
        
        return result
    
    def get_types(self) -> List[str]:
        """
        Get list of valid interaction types.
        
        Returns:
            List of valid interaction types
        """
        return INTERACTION_TYPES
    
    def _validate_site_access(self, site_id: int) -> List[int]:
        """
        Validate user has access to site (private helper method).
        
        Args:
            site_id: ID of the site to validate access for
            
        Returns:
            List containing the validated site_id
            
        Raises:
            ValueError: If site_id is invalid
        """
        # Validate site_id
        if site_id is None or not isinstance(site_id, int) or site_id <= 0:
            raise ValueError("Valid site_id is required")
        
        # For now, we're just returning a list with the single site_id
        # In the future, this could be expanded to handle multi-site access
        return [site_id]