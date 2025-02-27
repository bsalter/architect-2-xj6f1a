"""
Core database models for the Interaction Management System.

This module defines the database models using SQLAlchemy ORM for the Interaction
Management System, including User, Site, UserSiteMapping, and Interaction models
with their relationships.
"""

from datetime import datetime  # standard library
from ..extensions import db


class UserSiteMapping(db.Model):
    """
    Association model for Users and Sites with additional metadata like role and assignment date.
    
    This model implements the many-to-many relationship between users and sites,
    enabling the site-scoped security model of the application.
    """
    __tablename__ = 'user_site_mapping'
    
    mapping_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.site_id'), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    assigned_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='site_mappings')
    site = db.relationship('Site', back_populates='user_mappings')
    
    def __repr__(self):
        """String representation of the UserSiteMapping instance."""
        return f"<UserSiteMapping user_id={self.user_id} site_id={self.site_id}>"


class User(db.Model):
    """
    User model for authentication and user information management.
    
    This model stores user account information for authentication and profile management,
    and maintains associations with sites through the UserSiteMapping model.
    """
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Relationships
    site_mappings = db.relationship('UserSiteMapping', back_populates='user', cascade='all, delete-orphan')
    sites = db.relationship('Site', secondary='user_site_mapping', viewonly=True)
    
    created_interactions = db.relationship('Interaction', foreign_keys='Interaction.created_by',
                                          backref=db.backref('creator', lazy='joined'))
    updated_interactions = db.relationship('Interaction', foreign_keys='Interaction.updated_by',
                                          backref=db.backref('updater', lazy='joined'))
    
    def __repr__(self):
        """String representation of the User instance."""
        return f"<User username={self.username}>"


class Site(db.Model):
    """
    Site model for organizational units that contain interactions.
    
    This model represents distinct organizational units (sites) that serve as
    boundaries for data access and management within the application.
    """
    __tablename__ = 'sites'
    
    site_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    # Relationships
    user_mappings = db.relationship('UserSiteMapping', back_populates='site', cascade='all, delete-orphan')
    users = db.relationship('User', secondary='user_site_mapping', viewonly=True)
    interactions = db.relationship('Interaction', back_populates='site', cascade='all, delete-orphan')
    
    def __repr__(self):
        """String representation of the Site instance."""
        return f"<Site name={self.name}>"


class Interaction(db.Model):
    """
    Interaction model for the main data entity containing all interaction details.
    
    This is the primary data model of the application, representing interactions 
    with all their properties. Each interaction is associated with a specific site
    for access control purposes.
    """
    __tablename__ = 'interactions'
    
    interaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.site_id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    lead = db.Column(db.String(100), nullable=False)
    start_datetime = db.Column(db.DateTime, nullable=False)
    timezone = db.Column(db.String(50), nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Audit fields
    created_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # Relationships
    site = db.relationship('Site', back_populates='interactions')
    
    def __repr__(self):
        """String representation of the Interaction instance."""
        return f"<Interaction title={self.title}>"