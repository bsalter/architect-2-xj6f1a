"""
Utility module providing validation functions for the Interaction Management System.
Implements data validation logic for interaction records, search parameters, and other user inputs
to ensure data integrity and security.
"""

import re
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import bleach  # version 6.0.0

from .date_utils import validate_date_range, is_valid_timezone

# List of allowed interaction types
INTERACTION_TYPES = [
    "Meeting", "Call", "Email", "Update", "Training", "Review", 
    "Presentation", "Conference", "Workshop", "Other"
]

# Field length constraints
MAX_TITLE_LENGTH = 255
MAX_LEAD_LENGTH = 100
MAX_LOCATION_LENGTH = 255
MAX_DESCRIPTION_LENGTH = 5000
MAX_NOTES_LENGTH = 2000

# Pagination defaults and limits
DEFAULT_PAGE = 1
DEFAULT_PER_PAGE = 25
MAX_PER_PAGE = 100

# Sorting parameters
ALLOWED_SORT_FIELDS = [
    "title", "type", "lead", "start_datetime", "end_datetime", 
    "location", "created_at", "updated_at"
]
ALLOWED_SORT_DIRECTIONS = ["asc", "desc"]

# Regular expressions for validation
EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


class ValidationError(Exception):
    """
    Custom exception for validation errors.
    
    Attributes:
        message (str): Error message
        errors (dict): Dictionary of field-specific validation errors
    """
    
    def __init__(self, message: str, errors: Optional[Dict[str, str]] = None):
        """
        Initialize a validation error with message and error details.
        
        Args:
            message: General error message
            errors: Dictionary of field-specific validation errors
        """
        super().__init__(message)
        self.errors = errors or {}
        self.message = message
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert validation error to dictionary format for API responses.
        
        Returns:
            Dictionary representation of the validation error
        """
        return {
            "message": self.message,
            "errors": self.errors
        }


def validate_required_field(field_value: str, field_name: str) -> bool:
    """
    Validates that a required field is not None or empty.
    
    Args:
        field_value: Value to check
        field_name: Name of the field (for error messages)
    
    Returns:
        True if field is valid, False otherwise
    """
    if field_value is None:
        return False
    
    if isinstance(field_value, str) and not field_value.strip():
        return False
    
    return True


def validate_string_length(field_value: str, max_length: int, field_name: str) -> bool:
    """
    Validates that a string field does not exceed maximum length.
    
    Args:
        field_value: String value to check
        max_length: Maximum allowable length
        field_name: Name of the field (for error messages)
    
    Returns:
        True if field is valid, False otherwise
    """
    if field_value is None:
        return True  # None values are handled by validate_required_field
    
    if len(field_value) > max_length:
        return False
    
    return True


def validate_interaction_type(type_value: str) -> bool:
    """
    Validates that interaction type is one of the allowed types.
    
    Args:
        type_value: Interaction type to validate
    
    Returns:
        True if type is valid, False otherwise
    """
    return type_value in INTERACTION_TYPES


def validate_email(email: str) -> bool:
    """
    Validates that a string is a properly formatted email address.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if email is valid, False otherwise
    """
    if email is None:
        return False
    
    return bool(re.match(EMAIL_REGEX, email))


def validate_interaction(interaction_data: Dict[str, Any], is_creation: bool = True) -> Dict[str, str]:
    """
    Validates all fields of an interaction record.
    
    Args:
        interaction_data: Dictionary containing interaction data
        is_creation: Whether this is a new interaction (True) or an update (False)
    
    Returns:
        Dictionary with validation errors or empty if valid
    """
    errors = {}
    
    # Required fields validation for creation
    if is_creation:
        required_fields = ["title", "type", "lead", "start_datetime", "timezone"]
        for field in required_fields:
            if field not in interaction_data or not validate_required_field(interaction_data.get(field), field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
    
    # Validate title length
    if "title" in interaction_data and interaction_data["title"] is not None:
        if not validate_string_length(interaction_data["title"], MAX_TITLE_LENGTH, "title"):
            errors["title"] = f"Title must be less than {MAX_TITLE_LENGTH} characters"
    
    # Validate interaction type
    if "type" in interaction_data and interaction_data["type"] is not None:
        if not validate_interaction_type(interaction_data["type"]):
            errors["type"] = f"Type must be one of: {', '.join(INTERACTION_TYPES)}"
    
    # Validate lead length
    if "lead" in interaction_data and interaction_data["lead"] is not None:
        if not validate_string_length(interaction_data["lead"], MAX_LEAD_LENGTH, "lead"):
            errors["lead"] = f"Lead name must be less than {MAX_LEAD_LENGTH} characters"
    
    # Validate timezone
    if "timezone" in interaction_data and interaction_data["timezone"] is not None:
        if not is_valid_timezone(interaction_data["timezone"]):
            errors["timezone"] = "Invalid timezone"
    
    # Validate location length
    if "location" in interaction_data and interaction_data["location"] is not None:
        if not validate_string_length(interaction_data["location"], MAX_LOCATION_LENGTH, "location"):
            errors["location"] = f"Location must be less than {MAX_LOCATION_LENGTH} characters"
    
    # Validate description length
    if "description" in interaction_data and interaction_data["description"] is not None:
        if not validate_string_length(interaction_data["description"], MAX_DESCRIPTION_LENGTH, "description"):
            errors["description"] = f"Description must be less than {MAX_DESCRIPTION_LENGTH} characters"
    
    # Validate notes length
    if "notes" in interaction_data and interaction_data["notes"] is not None:
        if not validate_string_length(interaction_data["notes"], MAX_NOTES_LENGTH, "notes"):
            errors["notes"] = f"Notes must be less than {MAX_NOTES_LENGTH} characters"
    
    # Validate date range
    if "start_datetime" in interaction_data and "end_datetime" in interaction_data:
        start = interaction_data.get("start_datetime")
        end = interaction_data.get("end_datetime")
        timezone = interaction_data.get("timezone")
        
        if start and end and not validate_date_range(start, end, timezone):
            errors["end_datetime"] = "End date/time must be after start date/time"
    
    return errors


def sanitize_search_term(search_term: str) -> str:
    """
    Sanitizes user input for search operations to prevent injection attacks.
    
    Args:
        search_term: User-provided search input
    
    Returns:
        Sanitized search term
    """
    if search_term is None:
        return ""
    
    # Remove leading/trailing whitespace
    search_term = search_term.strip()
    
    # Use bleach to clean any HTML/script content
    search_term = bleach.clean(search_term, strip=True)
    
    # Remove potential SQL injection patterns
    search_term = re.sub(r'[;"\']', '', search_term)
    
    return search_term


def validate_pagination_params(page: Optional[int] = None, per_page: Optional[int] = None) -> Tuple[int, int]:
    """
    Validates and normalizes pagination parameters.
    
    Args:
        page: Requested page number
        per_page: Number of items per page
    
    Returns:
        Tuple of (page, per_page) with validated values
    """
    # Normalize page
    validated_page = DEFAULT_PAGE
    if page is not None and page > 0:
        validated_page = page
    
    # Normalize per_page
    validated_per_page = DEFAULT_PER_PAGE
    if per_page is not None and per_page > 0:
        validated_per_page = min(per_page, MAX_PER_PAGE)
    
    return (validated_page, validated_per_page)


def validate_sort_params(sort_by: Optional[str] = None, 
                         sort_direction: Optional[str] = None) -> Tuple[str, str]:
    """
    Validates and normalizes sorting parameters.
    
    Args:
        sort_by: Field to sort by
        sort_direction: Direction to sort (asc or desc)
    
    Returns:
        Tuple of (sort_by, sort_direction) with validated values
    """
    # Normalize sort_by
    validated_sort_by = "created_at"
    if sort_by in ALLOWED_SORT_FIELDS:
        validated_sort_by = sort_by
    
    # Normalize sort_direction
    validated_sort_direction = "desc"
    if sort_direction in ALLOWED_SORT_DIRECTIONS:
        validated_sort_direction = sort_direction
    
    return (validated_sort_by, validated_sort_direction)