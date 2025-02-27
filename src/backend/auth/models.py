"""
Models for user authentication and site-scoped access control.

This module defines SQLAlchemy models for user authentication and site-scoped access control,
including Flask-Login integration for user authentication and a user-site relationship model
for implementing site-scoped data access.
"""

from datetime import datetime, timezone
from flask_login import UserMixin  # v0.6.2

from ..extensions import db


class User(UserMixin, db.Model):
    """
    SQLAlchemy model representing a user in the system with Flask-Login integration.
    
    This model includes authentication properties (username, password_hash) and
    relationships to sites through the UserSite association model.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relationship with sites through UserSite association
    user_sites = db.relationship('UserSite', back_populates='user', lazy='joined', cascade='all, delete-orphan')
    sites = db.relationship('Site', secondary='user_site_mapping', viewonly=True, lazy='joined')
    
    def __init__(self, username, email, password_hash, is_active=True):
        """
        Initialize a new User instance.
        
        Args:
            username (str): The username for the user
            email (str): The email address for the user
            password_hash (str): The hashed password for the user
            is_active (bool, optional): Whether the user account is active. Defaults to True.
        """
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.is_active = is_active
        # last_login will be None initially
    
    def update_last_login(self):
        """
        Update the user's last login timestamp to the current UTC time.
        """
        self.last_login = datetime.now(timezone.utc)
    
    def get_site_ids(self):
        """
        Return a list of site IDs the user has access to.
        
        Returns:
            list[int]: List of site IDs the user has access to
        """
        return [user_site.site_id for user_site in self.user_sites]
    
    def has_site_access(self, site_id):
        """
        Check if the user has access to a specific site.
        
        Args:
            site_id (int): The ID of the site to check access for
            
        Returns:
            bool: True if the user has access to the site, False otherwise
        """
        return site_id in self.get_site_ids()
    
    def get_role_for_site(self, site_id):
        """
        Get the user's role for a specific site.
        
        Args:
            site_id (int): The ID of the site to get the role for
            
        Returns:
            str: The user's role for the site, or None if the user has no access
        """
        for user_site in self.user_sites:
            if user_site.site_id == site_id:
                return user_site.role
        return None


class UserSite(db.Model):
    """
    SQLAlchemy model representing the association between a user and a site.
    
    This model defines the many-to-many relationship between users and sites,
    including role information and assignment timestamp.
    """
    __tablename__ = 'user_site_mapping'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('sites.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    assigned_at = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc))
    
    # Relationships
    user = db.relationship('User', back_populates='user_sites')
    site = db.relationship('Site')
    
    def __init__(self, user_id, site_id, role):
        """
        Initialize a new UserSite instance.
        
        Args:
            user_id (int): The ID of the user
            site_id (int): The ID of the site
            role (str): The role of the user at the site
        """
        self.user_id = user_id
        self.site_id = site_id
        self.role = role
        self.assigned_at = datetime.now(timezone.utc)