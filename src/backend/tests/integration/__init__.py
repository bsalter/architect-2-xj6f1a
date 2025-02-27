"""
Integration Test Package for Interaction Management System

This package contains integration tests that verify the interactions between
various components of the backend system. These tests focus on ensuring that
different parts of the application work correctly together, including:

- API endpoints with proper request/response handling
- Service layer interactions with the database
- Authentication and authorization flows
- Site-scoping implementation across service boundaries

Integration tests use pytest-flask for testing Flask API endpoints and
a test database to verify data persistence operations.

The tests in this package assume that individual units have already been
tested in isolation and focus on the behavior of connected components.
"""

# This file intentionally left mostly empty except for the docstring.
# It serves to mark the integration test directory as a Python package
# for proper test discovery and organization.