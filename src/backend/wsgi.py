"""
WSGI entry point for the Interaction Management System.

This file creates and exports the Flask application instance for production
deployment with WSGI servers like Gunicorn.
"""

import os
from app import create_app
from config import get_config

# Create the Flask application instance
# The configuration is determined by environment variables (e.g., FLASK_ENV)
application = create_app(get_config())

# This application object is used by WSGI servers to serve the Flask application
# Example usage with Gunicorn: gunicorn -w 4 wsgi:application