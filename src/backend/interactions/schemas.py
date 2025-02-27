"""
Defines Marshmallow schemas for validation, serialization, and deserialization
of Interaction entities. These schemas ensure data integrity and provide proper
formatting for API requests and responses.
"""

from datetime import datetime
from typing import Dict, Any, Optional

import marshmallow
from marshmallow import ValidationError as MarshmallowValidationError

from ..extensions import ma
from .models import Interaction
from ..utils.validators import (
    validate_required_field,
    validate_string_length,
    validate_interaction_type,
    validate_interaction,
    sanitize_search_term,
    validate_pagination_params,
    validate_sort_params,
    ValidationError,
    INTERACTION_TYPES,
    MAX_TITLE_LENGTH,
    MAX_LEAD_LENGTH,
    MAX_LOCATION_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_NOTES_LENGTH
)
from ..utils.date_utils import validate_date_range, is_valid_timezone, DEFAULT_TIMEZONE


def validate_dates(data: Dict[str, Any]) -> None:
    """
    Custom validator for interaction date fields.
    
    Args:
        data: Dictionary containing interaction data
        
    Raises:
        ValidationError: If date validation fails
    """
    start_datetime = data.get('start_datetime')
    end_datetime = data.get('end_datetime')
    timezone = data.get('timezone')
    
    # Skip validation if required fields are missing (will be caught by field validators)
    if not start_datetime or not timezone:
        return
    
    # If end_datetime is present, validate that start_datetime is before end_datetime
    if end_datetime and not validate_date_range(start_datetime, end_datetime, timezone):
        raise ValidationError(
            "End date/time must be after start date/time",
            errors={"end_datetime": "End date/time must be after start date/time"}
        )


class InteractionBaseSchema(ma.Schema):
    """
    Base schema with common fields for Interaction entities.
    """
    class Meta:
        """Schema configuration."""
        ordered = True
        
    def __init__(self, **kwargs):
        """Initialize the schema with options."""
        super().__init__(**kwargs)


class InteractionCreateSchema(InteractionBaseSchema):
    """
    Schema for validating new interaction creation requests.
    """
    title = ma.fields.String(required=True)
    type = ma.fields.String(required=True)
    lead = ma.fields.String(required=True)
    start_datetime = ma.fields.DateTime(required=True)
    timezone = ma.fields.String(required=True)
    end_datetime = ma.fields.DateTime(required=False, allow_none=True)
    location = ma.fields.String(required=False, allow_none=True)
    description = ma.fields.String(required=False, allow_none=True)
    notes = ma.fields.String(required=False, allow_none=True)
    
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate interaction creation data.
        
        Args:
            data: Dictionary containing interaction data
            
        Returns:
            Validated and processed data
            
        Raises:
            ValidationError: If validation fails
        """
        errors = {}
        
        # Validate required fields
        for field in ['title', 'type', 'lead', 'start_datetime', 'timezone']:
            if field not in data or not validate_required_field(data.get(field), field):
                errors[field] = f"{field.replace('_', ' ').title()} is required"
        
        # Validate string length constraints
        if 'title' in data and not validate_string_length(data['title'], MAX_TITLE_LENGTH, 'title'):
            errors['title'] = f"Title must be less than {MAX_TITLE_LENGTH} characters"
            
        if 'lead' in data and not validate_string_length(data['lead'], MAX_LEAD_LENGTH, 'lead'):
            errors['lead'] = f"Lead name must be less than {MAX_LEAD_LENGTH} characters"
            
        if 'location' in data and data['location'] and not validate_string_length(data['location'], MAX_LOCATION_LENGTH, 'location'):
            errors['location'] = f"Location must be less than {MAX_LOCATION_LENGTH} characters"
            
        if 'description' in data and data['description'] and not validate_string_length(data['description'], MAX_DESCRIPTION_LENGTH, 'description'):
            errors['description'] = f"Description must be less than {MAX_DESCRIPTION_LENGTH} characters"
            
        if 'notes' in data and data['notes'] and not validate_string_length(data['notes'], MAX_NOTES_LENGTH, 'notes'):
            errors['notes'] = f"Notes must be less than {MAX_NOTES_LENGTH} characters"
        
        # Validate interaction type
        if 'type' in data and not validate_interaction_type(data['type']):
            errors['type'] = f"Type must be one of: {', '.join(INTERACTION_TYPES)}"
        
        # Validate timezone
        if 'timezone' in data and not is_valid_timezone(data['timezone']):
            errors['timezone'] = "Invalid timezone"
        
        # Validate date range
        if 'start_datetime' in data and 'end_datetime' in data and data['end_datetime']:
            if not validate_date_range(data['start_datetime'], data['end_datetime'], data.get('timezone')):
                errors['end_datetime'] = "End date/time must be after start date/time"
        
        # If there are validation errors, raise exception
        if errors:
            raise ValidationError("Validation failed", errors=errors)
            
        return data


class InteractionUpdateSchema(InteractionBaseSchema):
    """
    Schema for validating interaction update requests.
    """
    title = ma.fields.String(required=False)
    type = ma.fields.String(required=False)
    lead = ma.fields.String(required=False)
    start_datetime = ma.fields.DateTime(required=False)
    timezone = ma.fields.String(required=False)
    end_datetime = ma.fields.DateTime(required=False, allow_none=True)
    location = ma.fields.String(required=False, allow_none=True)
    description = ma.fields.String(required=False, allow_none=True)
    notes = ma.fields.String(required=False, allow_none=True)
    
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate interaction update data.
        
        Args:
            data: Dictionary containing interaction data
            
        Returns:
            Validated and processed data
            
        Raises:
            ValidationError: If validation fails
        """
        errors = {}
        
        # For updates, fields may be missing (partial update)
        # But if they are present, validate them
        
        # Validate string length constraints
        if 'title' in data and not validate_string_length(data['title'], MAX_TITLE_LENGTH, 'title'):
            errors['title'] = f"Title must be less than {MAX_TITLE_LENGTH} characters"
            
        if 'lead' in data and not validate_string_length(data['lead'], MAX_LEAD_LENGTH, 'lead'):
            errors['lead'] = f"Lead name must be less than {MAX_LEAD_LENGTH} characters"
            
        if 'location' in data and data['location'] and not validate_string_length(data['location'], MAX_LOCATION_LENGTH, 'location'):
            errors['location'] = f"Location must be less than {MAX_LOCATION_LENGTH} characters"
            
        if 'description' in data and data['description'] and not validate_string_length(data['description'], MAX_DESCRIPTION_LENGTH, 'description'):
            errors['description'] = f"Description must be less than {MAX_DESCRIPTION_LENGTH} characters"
            
        if 'notes' in data and data['notes'] and not validate_string_length(data['notes'], MAX_NOTES_LENGTH, 'notes'):
            errors['notes'] = f"Notes must be less than {MAX_NOTES_LENGTH} characters"
        
        # Validate interaction type
        if 'type' in data and not validate_interaction_type(data['type']):
            errors['type'] = f"Type must be one of: {', '.join(INTERACTION_TYPES)}"
        
        # Validate timezone
        if 'timezone' in data and not is_valid_timezone(data['timezone']):
            errors['timezone'] = "Invalid timezone"
        
        # Validate date range if both dates are present
        if ('start_datetime' in data and 'end_datetime' in data and data['end_datetime'] and 
                not validate_date_range(data['start_datetime'], data['end_datetime'], data.get('timezone'))):
            errors['end_datetime'] = "End date/time must be after start date/time"
        
        # If there are validation errors, raise exception
        if errors:
            raise ValidationError("Validation failed", errors=errors)
            
        return data


class InteractionResponseSchema(InteractionBaseSchema):
    """
    Schema for formatting interaction responses.
    """
    id = ma.fields.Integer(attribute="interaction_id")
    site_id = ma.fields.Integer()
    title = ma.fields.String()
    type = ma.fields.String()
    lead = ma.fields.String()
    start_datetime = ma.fields.DateTime()
    timezone = ma.fields.String()
    end_datetime = ma.fields.DateTime(allow_none=True)
    location = ma.fields.String(allow_none=True)
    description = ma.fields.String(allow_none=True)
    notes = ma.fields.String(allow_none=True)
    created_by = ma.fields.Integer()
    created_at = ma.fields.DateTime()
    updated_by = ma.fields.Integer(allow_none=True)
    updated_at = ma.fields.DateTime(allow_none=True)
    
    # Additional fields from related models
    site_name = ma.fields.String(allow_none=True)
    creator_name = ma.fields.String(allow_none=True)
    updater_name = ma.fields.String(allow_none=True)


class InteractionSearchSchema(InteractionBaseSchema):
    """
    Schema for validating interaction search parameters.
    """
    search = ma.fields.String(required=False, allow_none=True)
    title = ma.fields.String(required=False, allow_none=True)
    type = ma.fields.String(required=False, allow_none=True)
    lead = ma.fields.String(required=False, allow_none=True)
    start_date = ma.fields.DateTime(required=False, allow_none=True)
    end_date = ma.fields.DateTime(required=False, allow_none=True)
    location = ma.fields.String(required=False, allow_none=True)
    page = ma.fields.Integer(required=False, allow_none=True)
    per_page = ma.fields.Integer(required=False, allow_none=True)
    sort_by = ma.fields.String(required=False, allow_none=True)
    sort_direction = ma.fields.String(required=False, allow_none=True)
    
    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate search parameters.
        
        Args:
            data: Dictionary containing search parameters
            
        Returns:
            Validated and processed search parameters
            
        Raises:
            ValidationError: If validation fails
        """
        errors = {}
        
        # Sanitize search term if present
        if 'search' in data and data['search']:
            data['search'] = sanitize_search_term(data['search'])
        
        # Validate pagination parameters
        if 'page' in data or 'per_page' in data:
            page = data.get('page')
            per_page = data.get('per_page')
            valid_page, valid_per_page = validate_pagination_params(page, per_page)
            data['page'] = valid_page
            data['per_page'] = valid_per_page
        
        # Validate sort parameters
        if 'sort_by' in data or 'sort_direction' in data:
            sort_by = data.get('sort_by')
            sort_direction = data.get('sort_direction')
            valid_sort_by, valid_sort_direction = validate_sort_params(sort_by, sort_direction)
            data['sort_by'] = valid_sort_by
            data['sort_direction'] = valid_sort_direction
        
        # Validate date range if both dates are present
        if 'start_date' in data and 'end_date' in data and data['start_date'] and data['end_date']:
            if not validate_date_range(data['start_date'], data['end_date']):
                errors['end_date'] = "Start date must be before end date"
        
        # If there are validation errors, raise exception
        if errors:
            raise ValidationError("Validation failed", errors=errors)
            
        return data