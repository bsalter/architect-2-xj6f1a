"""
Models for the Interaction Management System's interactions module.

This module defines the SQLAlchemy ORM model for Interaction entities,
which is the core data model for storing interaction records in the database.
It includes all required fields as defined in the technical specification.
"""

from datetime import datetime

from ..extensions import db
from ..utils.date_utils import get_current_datetime
from ..utils.validators import (
    MAX_TITLE_LENGTH,
    MAX_LEAD_LENGTH,
    MAX_LOCATION_LENGTH,
    MAX_DESCRIPTION_LENGTH,
    MAX_NOTES_LENGTH,
    INTERACTION_TYPES
)


class Interaction(db.Model):
    """
    SQLAlchemy model representing an interaction record in the system.
    
    This is the main data entity that stores information about interactions
    including title, type, lead, dates, location, description, and notes.
    It has relationships to the Site model for site-scoping and User model
    for tracking creation and updates.
    """
    __tablename__ = 'interactions'
    
    # Primary key
    interaction_id = db.Column(db.Integer, primary_key=True)
    
    # Site foreign key for site-scoping
    site_id = db.Column(db.Integer, db.ForeignKey('sites.site_id'), nullable=False)
    
    # Core interaction fields
    title = db.Column(db.String(MAX_TITLE_LENGTH), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    lead = db.Column(db.String(MAX_LEAD_LENGTH), nullable=False)
    start_datetime = db.Column(db.DateTime, nullable=False)
    timezone = db.Column(db.String(50), nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=True)
    location = db.Column(db.String(MAX_LOCATION_LENGTH), nullable=True)
    description = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit fields
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=get_current_datetime)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    site = db.relationship('Site', backref=db.backref('interactions', lazy=True))
    creator = db.relationship('User', foreign_keys=[created_by], backref=db.backref('created_interactions', lazy=True))
    updater = db.relationship('User', foreign_keys=[updated_by], backref=db.backref('updated_interactions', lazy=True))
    
    def __init__(self, **kwargs):
        """
        Initialize a new Interaction instance with the provided attributes.
        
        Args:
            **kwargs: Keyword arguments for setting model attributes
        """
        # Set created_at to current datetime if not provided
        if 'created_at' not in kwargs:
            kwargs['created_at'] = get_current_datetime()
        
        # Set attributes from kwargs
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def __repr__(self):
        """
        Returns a string representation of the Interaction object.
        
        Returns:
            String representation showing interaction title and id
        """
        return f"<Interaction {self.interaction_id}: {self.title}>"
    
    def update(self, data, user_id):
        """
        Updates the interaction with new values and sets updated_at timestamp.
        
        Args:
            data (dict): Dictionary containing updated values
            user_id (int): ID of the user making the update
            
        Returns:
            None: Updates the interaction in place
        """
        # Update attributes with values from data dictionary
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        # Set audit information
        self.updated_by = user_id
        self.updated_at = get_current_datetime()
    
    def to_dict(self):
        """
        Converts the interaction to a dictionary representation.
        
        Returns:
            dict: Dictionary containing all interaction attributes
        """
        interaction_dict = {
            'interaction_id': self.interaction_id,
            'site_id': self.site_id,
            'title': self.title,
            'type': self.type,
            'lead': self.lead,
            'start_datetime': self.start_datetime,
            'timezone': self.timezone,
            'end_datetime': self.end_datetime,
            'location': self.location,
            'description': self.description,
            'notes': self.notes,
            'created_by': self.created_by,
            'created_at': self.created_at,
            'updated_by': self.updated_by,
            'updated_at': self.updated_at
        }
        
        # Add related data if available
        if hasattr(self, 'site') and self.site:
            interaction_dict['site_name'] = self.site.name
            
        if hasattr(self, 'creator') and self.creator:
            interaction_dict['creator_name'] = self.creator.username
            
        if hasattr(self, 'updater') and self.updater:
            interaction_dict['updater_name'] = self.updater.username
            
        return interaction_dict