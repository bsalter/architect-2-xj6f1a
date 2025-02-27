"""
Database models for Site entities using SQLAlchemy ORM.

This module defines the Site model which represents organizational units that
contain users and interactions, providing a boundary for data access as part of
the site-scoping security mechanism.
"""

from datetime import datetime  # standard library
from ..extensions import db

class Site(db.Model):
    """
    Database model representing a site in the system.
    
    Sites are organizational units that contain users and interactions,
    providing a boundary for data access.
    """
    
    __tablename__ = 'sites'
    
    # Primary key
    site_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Site details
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships - using strings to avoid circular imports
    # Many-to-many relationship with users through user_site_mapping
    users = db.relationship(
        'User',
        secondary='user_site_mapping',
        backref=db.backref('sites', lazy='dynamic'),
        lazy='dynamic'
    )
    
    # One-to-many relationship with interactions
    interactions = db.relationship(
        'Interaction',
        backref='site',
        lazy='dynamic'
    )
    
    def __repr__(self):
        """String representation of the Site object."""
        return f"<Site {self.name}>"