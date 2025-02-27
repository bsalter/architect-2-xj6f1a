"""
Utility module providing comprehensive date and time handling functionality for the Interaction Management System.
Includes timezone conversion, date/time formatting, validation, and other date-related operations
essential for managing interaction records with proper timezone support.
"""

from datetime import datetime
import pytz  # version 2023.3
from typing import List, Optional, Union
from dateutil import parser as dateutil_parser  # from python-dateutil 2.8.2
from sqlalchemy import Column  # version 2.0.19

# Default timezone for the application
DEFAULT_TIMEZONE = "America/New_York"

# Standard date format strings
DATE_FORMAT = "%Y-%m-%d"
DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S"
DISPLAY_DATETIME_FORMAT = "%m/%d/%Y %H:%M"

# List of common timezones for UI selection
COMMON_TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Honolulu",
    "America/Toronto",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland"
]


def parse_datetime(datetime_str: str, format_str: Optional[str] = None) -> Optional[datetime]:
    """
    Parses a string representation of a date/time into a datetime object.
    
    Args:
        datetime_str: String to parse
        format_str: Format string for parsing (if None, uses flexible dateutil parsing)
    
    Returns:
        Parsed datetime object or None if parsing fails
    """
    if not datetime_str:
        return None
    
    try:
        if format_str:
            return datetime.strptime(datetime_str, format_str)
        else:
            # Use dateutil for more flexible parsing
            return dateutil_parser.parse(datetime_str)
    except (ValueError, TypeError):
        # Parsing failed
        return None


def format_datetime(dt: Optional[datetime], format_str: Optional[str] = None) -> str:
    """
    Formats a datetime object into a string using the specified format.
    
    Args:
        dt: Datetime object to format
        format_str: Format string to use (defaults to DISPLAY_DATETIME_FORMAT)
    
    Returns:
        Formatted datetime string or empty string if dt is None
    """
    if dt is None:
        return ""
    
    format_to_use = format_str or DISPLAY_DATETIME_FORMAT
    return dt.strftime(format_to_use)


def is_valid_timezone(timezone: str) -> bool:
    """
    Checks if a timezone string is valid.
    
    Args:
        timezone: Timezone string to validate
    
    Returns:
        True if valid timezone, False otherwise
    """
    if not timezone:
        return False
    
    try:
        return timezone in pytz.all_timezones
    except Exception:
        return False


def convert_timezone(dt: Optional[datetime], from_tz: str, to_tz: str) -> Optional[datetime]:
    """
    Converts a datetime from one timezone to another.
    
    Args:
        dt: Datetime object to convert
        from_tz: Source timezone
        to_tz: Target timezone
    
    Returns:
        Datetime in target timezone or None if conversion fails
    """
    if dt is None:
        return None
    
    # Verify both timezones are valid
    if not is_valid_timezone(from_tz) or not is_valid_timezone(to_tz):
        return None
    
    try:
        # Get timezone objects
        source_tz = pytz.timezone(from_tz)
        target_tz = pytz.timezone(to_tz)
        
        # If datetime is naive (no timezone info), localize it to the source timezone
        if dt.tzinfo is None:
            dt = source_tz.localize(dt)
        elif dt.tzinfo.zone != from_tz:
            # If datetime has a different timezone, convert it to the source timezone first
            dt = dt.astimezone(source_tz)
        
        # Convert to target timezone
        return dt.astimezone(target_tz)
    except Exception:
        # Conversion failed
        return None


def validate_date_range(start_datetime: Optional[datetime], 
                        end_datetime: Optional[datetime],
                        timezone: Optional[str] = None) -> bool:
    """
    Validates that start datetime is before or equal to end datetime.
    
    Args:
        start_datetime: Start datetime
        end_datetime: End datetime
        timezone: Timezone to normalize datetimes for comparison
    
    Returns:
        True if valid range (start <= end), False otherwise
    """
    # If either datetime is None, consider it valid (incomplete data)
    if start_datetime is None or end_datetime is None:
        return True
    
    # If timezone is specified and valid, ensure both datetimes are in that timezone
    # for accurate comparison
    if timezone and is_valid_timezone(timezone):
        tz = pytz.timezone(timezone)
        
        # Normalize start_datetime
        if start_datetime.tzinfo is None:
            start_datetime = tz.localize(start_datetime)
        else:
            start_datetime = start_datetime.astimezone(tz)
            
        # Normalize end_datetime
        if end_datetime.tzinfo is None:
            end_datetime = tz.localize(end_datetime)
        else:
            end_datetime = end_datetime.astimezone(tz)
    
    # Compare datetimes
    return start_datetime <= end_datetime


def get_current_datetime(timezone: Optional[str] = None) -> datetime:
    """
    Gets the current datetime in the specified timezone.
    
    Args:
        timezone: Timezone for the current datetime (defaults to DEFAULT_TIMEZONE)
    
    Returns:
        Current datetime in specified timezone
    """
    tz_to_use = timezone if timezone and is_valid_timezone(timezone) else DEFAULT_TIMEZONE
    utc_now = datetime.now(pytz.UTC)
    return utc_now.astimezone(pytz.timezone(tz_to_use))


def get_date_range_filter(start_date: Optional[datetime], 
                         end_date: Optional[datetime], 
                         date_column: Column) -> List:
    """
    Creates SQLAlchemy filter conditions for date range queries.
    
    Args:
        start_date: Start date for range (inclusive)
        end_date: End date for range (inclusive)
        date_column: SQLAlchemy Column to filter on
    
    Returns:
        List of SQLAlchemy filter conditions
    """
    filters = []
    
    if start_date:
        filters.append(date_column >= start_date)
    
    if end_date:
        filters.append(date_column <= end_date)
    
    return filters


def get_common_timezones() -> List[str]:
    """
    Returns a list of common timezone strings.
    
    Returns:
        List of common timezone strings for UI display
    """
    return COMMON_TIMEZONES


def utc_to_timezone(dt: Optional[datetime], timezone: str) -> Optional[datetime]:
    """
    Converts a UTC datetime to a specific timezone.
    
    Args:
        dt: Datetime in UTC
        timezone: Target timezone
    
    Returns:
        Datetime in target timezone or None if conversion fails
    """
    if dt is None:
        return None
    
    if not is_valid_timezone(timezone):
        return None
    
    try:
        # If datetime is naive, assume it's UTC
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        else:
            # Ensure the datetime is in UTC
            dt = dt.astimezone(pytz.UTC)
        
        # Convert to target timezone
        target_tz = pytz.timezone(timezone)
        return dt.astimezone(target_tz)
    except Exception:
        # Conversion failed
        return None


def timezone_to_utc(dt: Optional[datetime], source_timezone: str) -> Optional[datetime]:
    """
    Converts a timezone-aware datetime to UTC.
    
    Args:
        dt: Datetime to convert
        source_timezone: Source timezone (only used if dt is naive)
    
    Returns:
        Datetime in UTC or None if conversion fails
    """
    if dt is None:
        return None
    
    try:
        # If datetime is naive, localize it to the source timezone
        if dt.tzinfo is None:
            if not is_valid_timezone(source_timezone):
                return None
            source_tz = pytz.timezone(source_timezone)
            dt = source_tz.localize(dt)
        
        # Convert to UTC
        return dt.astimezone(pytz.UTC)
    except Exception:
        # Conversion failed
        return None