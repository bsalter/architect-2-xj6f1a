"""
Utility module providing pagination functionality for API responses and database queries.
Enables the Finder view to display paginated interaction records with consistent navigation.
"""

from flask import request  # version 2.3.2
from typing import Dict, List, Optional, Any, Tuple, Union
import math
from sqlalchemy.orm import Query  # version 2.0.19

from .validators import validate_pagination_params

# Default pagination values
DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100
MIN_PAGE_SIZE = 10


def get_pagination_params() -> Tuple[int, int]:
    """
    Extract and validate pagination parameters from HTTP request.
    
    Returns:
        Tuple[int, int]: Validated (page, page_size) integers
    """
    # Extract page and page_size from request query parameters
    try:
        page = int(request.args.get('page', DEFAULT_PAGE))
    except (ValueError, TypeError):
        page = DEFAULT_PAGE
    
    try:
        page_size = int(request.args.get('page_size', DEFAULT_PAGE_SIZE))
    except (ValueError, TypeError):
        page_size = DEFAULT_PAGE_SIZE
    
    # Use validate_pagination_params to ensure values are within valid ranges
    page, page_size = validate_pagination_params(page, page_size)
    
    return page, page_size


def get_pagination_metadata(total_items: int, page: int, page_size: int) -> Dict[str, Any]:
    """
    Calculate pagination metadata for response headers.
    
    Args:
        total_items: Total number of items
        page: Current page number
        page_size: Number of items per page
    
    Returns:
        Dict containing pagination metadata
    """
    # Calculate total_pages using math.ceil(total_items / page_size)
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1
    
    # Ensure page does not exceed total_pages
    page = min(page, total_pages)
    
    # Calculate has_next and has_prev boolean flags
    has_next = page < total_pages
    has_prev = page > 1
    
    # Calculate next_page and prev_page numbers if applicable
    next_page = page + 1 if has_next else None
    prev_page = page - 1 if has_prev else None
    
    return {
        'total': total_items,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages,
        'has_next': has_next,
        'has_prev': has_prev,
        'next_page': next_page,
        'prev_page': prev_page
    }


def apply_pagination(query: Query, page: int, page_size: int) -> Query:
    """
    Apply pagination to a SQLAlchemy query.
    
    Args:
        query: SQLAlchemy query object
        page: Page number (1-based)
        page_size: Number of items per page
    
    Returns:
        SQLAlchemy query with pagination applied
    """
    # Calculate offset based on (page - 1) * page_size
    offset = (page - 1) * page_size
    
    # Apply offset and limit to the query
    return query.offset(offset).limit(page_size)


def paginate_response(items: List[Any], total_items: int, page: int, page_size: int) -> Dict[str, Any]:
    """
    Format API response with pagination metadata and results.
    
    Args:
        items: List of items for current page
        total_items: Total number of items across all pages
        page: Current page number
        page_size: Number of items per page
    
    Returns:
        Dict containing formatted response with data and pagination metadata
    """
    # Get pagination metadata using get_pagination_metadata
    pagination = get_pagination_metadata(total_items, page, page_size)
    
    # Construct response dictionary with data and metadata
    response = {
        'data': items,
        'pagination': pagination
    }
    
    # Return the formatted response dictionary
    return response


class PaginatedResult:
    """
    Container class for holding paginated query results with metadata.
    """
    
    def __init__(self, items: List[Any], total: int, page: int, page_size: int):
        """
        Initialize a paginated result with items and metadata.
        
        Args:
            items: List of items for current page
            total: Total number of items across all pages
            page: Current page number
            page_size: Number of items per page
        """
        # Store provided items and metadata
        self.items = items
        self.total = total
        self.page = page
        self.page_size = page_size
        
        # Calculate total_pages using math.ceil(total / page_size)
        self.total_pages = math.ceil(total / page_size) if total > 0 else 1
        
        # Calculate has_next flag (page < total_pages)
        self.has_next = page < self.total_pages
        
        # Calculate has_prev flag (page > 1)
        self.has_prev = page > 1
        
        # Calculate next_page if has_next is True
        self.next_page = page + 1 if self.has_next else None
        
        # Calculate prev_page if has_prev is True
        self.prev_page = page - 1 if self.has_prev else None
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert paginated result to dictionary format for API responses.
        
        Returns:
            Dict with items and pagination metadata
        """
        # Construct dictionary with items list
        result = {
            'data': self.items,
            'pagination': {
                'total': self.total,
                'page': self.page,
                'page_size': self.page_size,
                'total_pages': self.total_pages,
                'has_next': self.has_next,
                'has_prev': self.has_prev,
                'next_page': self.next_page,
                'prev_page': self.prev_page
            }
        }
        
        # Return the formatted dictionary
        return result


class Paginator:
    """
    Helper class for applying pagination to database queries.
    """
    
    def paginate_query(self, query: Query, page: int, page_size: int) -> PaginatedResult:
        """
        Apply pagination to a SQLAlchemy query and return results with metadata.
        
        Args:
            query: SQLAlchemy query object
            page: Page number (1-based)
            page_size: Number of items per page
        
        Returns:
            PaginatedResult containing items and pagination metadata
        """
        # Execute count query to get total items count
        total = query.count()
        
        # Apply pagination to the query using apply_pagination
        paginated_query = apply_pagination(query, page, page_size)
        
        # Execute paginated query to get items for current page
        items = paginated_query.all()
        
        # Create and return PaginatedResult with items and metadata
        return PaginatedResult(items, total, page, page_size)