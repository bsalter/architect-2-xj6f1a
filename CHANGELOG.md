# Changelog
All notable changes to the Interaction Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2023-08-25
### Added
- User authentication and authorization system
- Site-scoped access control for multi-tenant data isolation
- Interaction Finder with advanced search and filtering capabilities
- Full CRUD operations for Interaction management
- Comprehensive Interaction form with all required fields:
  - Title, type, lead
  - Start date/time with timezone support
  - End date/time
  - Location
  - Description
  - Notes
- Responsive design supporting desktop and mobile views
- Role-based access control within sites
- Pagination for large data sets
- Sort functionality on all Interaction fields
- Site context switching for users with multiple site access

### Security
- JWT-based authentication with 24-hour token expiration
- Password complexity requirements and account lockout after failed attempts
- Site-scoped data access ensuring proper data isolation
- HTTPS for all communications with TLS 1.2+
- Input validation and sanitization across all entry points
- CSRF protection for form submissions
- Comprehensive audit logging of security events