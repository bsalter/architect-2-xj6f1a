"""
Defines marshmallow schemas for Site entity validation, serialization, and deserialization 
to support the API layer of the Interaction Management System.
"""

from marshmallow import fields, Schema, validate
from ..extensions import db, ma
from ..database.models import Site, UserSiteMapping as UserSite


class SiteSchema(ma.SQLAlchemySchema):
    """
    Marshmallow schema for the Site model, used for serialization and deserialization.
    
    Provides field definitions and validation rules for Site entities, including
    computed fields like user_count.
    """
    class Meta:
        """Meta configuration for the schema."""
        model = Site
        fields = ("id", "name", "description", "is_active", "created_at", "users", "user_count")

    id = fields.Integer(attribute="site_id", dump_only=True)
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String(allow_none=True)
    is_active = fields.Boolean(default=True)
    created_at = fields.DateTime(dump_only=True)
    users = fields.Nested('UserSchema', many=True, dump_only=True)
    user_count = fields.Method("get_user_count")
    
    def get_user_count(self, obj):
        """
        Returns the count of users associated with a site.
        
        Args:
            obj (Site): Site model instance
            
        Returns:
            int: Number of users associated with the site
        """
        return UserSite.query.filter_by(site_id=obj.site_id).count()


class SiteCreateSchema(Schema):
    """
    Schema for validating site creation requests.
    
    Enforces validation rules for required fields and field constraints
    when creating a new site.
    """
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String(allow_none=True)
    is_active = fields.Boolean(default=True)


class SiteUpdateSchema(Schema):
    """
    Schema for validating site update requests.
    
    Similar to SiteCreateSchema but all fields are optional to support
    partial updates of site records.
    """
    name = fields.String(validate=validate.Length(min=1, max=100))
    description = fields.String(allow_none=True)
    is_active = fields.Boolean()


class UserSiteSchema(ma.SQLAlchemySchema):
    """
    Schema for user-site association data.
    
    Handles serialization and deserialization of the UserSite model, which
    represents the many-to-many relationship between users and sites.
    """
    class Meta:
        """Meta configuration for the schema."""
        model = UserSite
        fields = ("user_id", "site_id", "role", "assigned_at")
    
    user_id = fields.Integer(required=True)
    site_id = fields.Integer(required=True)
    role = fields.String(required=True, validate=validate.OneOf(["admin", "editor", "viewer"]))
    assigned_at = fields.DateTime(dump_only=True)


class SiteListSchema(Schema):
    """
    Schema for formatting site listing responses with pagination.
    
    Provides a standard format for paginated site listings, including
    total counts and pagination metadata.
    """
    items = fields.List(fields.Nested(SiteSchema))
    total = fields.Integer()
    page = fields.Integer()
    per_page = fields.Integer()
    pages = fields.Integer()