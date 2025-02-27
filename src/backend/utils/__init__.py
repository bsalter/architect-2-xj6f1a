"""
Initialization file for the backend utilities package that exposes commonly used functions,
classes, and constants from the utility modules for easier imports throughout the application.

This module serves as a convenient interface to the various utility modules:
- date_utils: Date and time handling functions
- logging: Structured logging and CloudWatch integration
- pagination: Pagination utilities for API responses
- security: Security-related functions (password hashing, tokens, CSRF)
- validators: Data validation for interactions and user inputs
"""

# Import everything from date_utils
from .date_utils import *

# Import specific logging utilities
from .logging import (
    setup_logging,
    create_structured_log,
    log_exception,
    JsonFormatter,
    RequestContextFilter,
    CloudWatchHandler
)

# Import pagination utilities
from .pagination import *

# Import security utilities
from .security import *

# Import validation utilities
from .validators import *

# Define all exported symbols
__all__ = [
    # Date utilities
    "parse_datetime", "format_datetime", "convert_timezone", "validate_date_range",
    "get_current_datetime", "get_date_range_filter", "is_valid_timezone",
    "get_common_timezones", "utc_to_timezone", "timezone_to_utc",
    "DEFAULT_TIMEZONE", "DATE_FORMAT", "DATETIME_FORMAT", "DISPLAY_DATETIME_FORMAT",
    "COMMON_TIMEZONES",
    
    # Logging utilities
    "setup_logging", "create_structured_log", "log_exception",
    "JsonFormatter", "RequestContextFilter", "CloudWatchHandler",
    
    # Pagination utilities
    "get_pagination_params", "get_pagination_metadata", "apply_pagination",
    "paginate_response", "PaginatedResult", "Paginator",
    
    # Security utilities
    "hash_password", "verify_password", "validate_password_strength",
    "generate_token", "decode_token", "generate_reset_token", "log_security_event",
    "get_request_ip", "generate_csrf_token", "validate_csrf_token", "set_secure_headers",
    "sanitize_input", "CSRFProtect",
    
    # Validation utilities
    "validate_required_field", "validate_string_length", "validate_interaction_type",
    "validate_email", "validate_interaction", "sanitize_search_term",
    "validate_pagination_params", "validate_sort_params", "ValidationError",
    "INTERACTION_TYPES", "MAX_TITLE_LENGTH", "MAX_LEAD_LENGTH", "MAX_LOCATION_LENGTH",
    "MAX_DESCRIPTION_LENGTH", "MAX_NOTES_LENGTH", "ALLOWED_SORT_FIELDS",
    "ALLOWED_SORT_DIRECTIONS"
]