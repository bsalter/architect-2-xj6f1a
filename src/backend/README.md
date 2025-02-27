# Interaction Management System - Backend

## Overview

The Interaction Management System backend is a Flask-based RESTful API providing comprehensive functionality for managing interaction records across multiple organizational sites. It implements a secure, scalable architecture with site-scoped multi-tenancy, enabling organizations to track and manage interactions while maintaining strict data isolation between sites.

Key capabilities include:
- Complete CRUD operations for Interaction entities
- Site-scoped data access control
- JWT-based authentication and authorization
- Advanced search and filtering for the Finder interface
- Caching for improved performance
- Comprehensive data validation and error handling

## Requirements

- Python 3.11+
- PostgreSQL 15.3+
- Redis 7.0.12+ (for caching)
- Additional dependencies:
  - Flask 2.3.2
  - SQLAlchemy 2.0.19
  - Flask-JWT-Extended 4.5.2
  - Flask-Cors 4.0.0
  - marshmallow 3.20.1
  - psycopg2-binary 2.9.6
  - alembic 1.11.1
  - redis 4.6.0
  - gunicorn 21.2.0 (for production)

## Project Structure

```
src/backend/
├── app.py                 # Application factory and main entry point
├── config.py              # Configuration settings for different environments
├── extensions.py          # Flask extensions initialization
├── wsgi.py                # WSGI entry point for production deployment
├── auth/                  # Authentication and authorization components
│   ├── __init__.py
│   ├── controllers.py     # Authentication API endpoints
│   ├── models.py          # User and site association models
│   ├── services.py        # Auth business logic
│   └── utils.py           # Authentication utilities
├── database/              # Database models and migration scripts
│   ├── __init__.py
│   ├── models.py          # Base model definitions
│   └── migrations/        # Alembic migration scripts
├── interactions/          # Interaction CRUD operations and search
│   ├── __init__.py
│   ├── controllers.py     # Interaction API endpoints
│   ├── models.py          # Interaction entity model
│   ├── schemas.py         # Validation schemas
│   ├── services.py        # Business logic for interactions
│   └── utils.py           # Interaction utilities
├── sites/                 # Site management and context handling
│   ├── __init__.py
│   ├── controllers.py     # Site API endpoints
│   ├── models.py          # Site entity model
│   ├── schemas.py         # Validation schemas
│   └── services.py        # Site context management
├── utils/                 # Utility functions and helpers
│   ├── __init__.py
│   ├── error_handlers.py  # Error handling utilities
│   ├── validators.py      # Common validation functions
│   └── pagination.py      # Pagination utilities
├── scripts/               # Development and maintenance scripts
│   ├── seed_db.py         # Database seeding script
│   ├── create_admin.py    # Create admin user script
│   └── cleanup.py         # Database cleanup utilities
└── tests/                 # Test suite organized by component
    ├── conftest.py        # Test fixtures and configuration
    ├── test_auth/         # Authentication tests
    ├── test_interactions/ # Interaction tests
    └── test_sites/        # Site tests
```

## Setup

### Initial Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-organization/interaction-management.git
   cd interaction-management/src/backend
   ```

2. Ensure you have the required versions of Python, PostgreSQL, and Redis installed on your system.

### Environment Variables

Create a `.env` file in the `src/backend` directory with the following variables:

```
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/interaction_management
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/interaction_management_test

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=86400  # 24 hours in seconds

# Logging Configuration
LOG_LEVEL=INFO
```

For production environments, ensure to set strong, unique secret keys and restrict your database permissions appropriately.

### Database Setup

1. Create the PostgreSQL databases:
   ```
   createdb interaction_management
   createdb interaction_management_test  # For running tests
   ```

2. Update the `.env` file with your PostgreSQL credentials.

### Redis Setup

1. Ensure Redis server is running:
   ```
   redis-server
   ```

2. Verify Redis connection:
   ```
   redis-cli ping
   ```
   Should return `PONG`.

### Development Environment

1. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```
   flask db upgrade
   ```

4. Seed initial data (optional):
   ```
   python scripts/seed_db.py
   ```

## Running the Application

### Development

1. Start the Flask development server:
   ```
   flask run
   ```
   The server will be available at http://127.0.0.1:5000/

2. To enable debug mode (not recommended for production):
   ```
   flask run --debug
   ```

### Production

For production deployment, use Gunicorn with a process manager like Supervisord:

1. Start the application with Gunicorn:
   ```
   gunicorn wsgi:app -w 4 -b 0.0.0.0:5000 --access-logfile -
   ```

2. Configure Nginx as a reverse proxy to handle client requests.

3. Set appropriate environment variables for production:
   - Set `FLASK_ENV=production`
   - Use a strong `SECRET_KEY` and `JWT_SECRET_KEY`
   - Configure production database and Redis connections

### Docker

The application can be run using Docker:

1. Build the Docker image:
   ```
   docker build -t interaction-management-backend .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 --env-file .env interaction-management-backend
   ```

For development with Docker Compose:
   ```
   docker-compose up
   ```

## API Documentation

The API follows RESTful conventions with JSON as the primary data format. All API endpoints require authentication except for the login endpoint.

### Authentication

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "user@example.com",
    "password": "secure_password"
  }
  ```
- **Success Response**:
  - Status: `200 OK`
  - Content:
    ```json
    {
      "token": "jwt_token_string",
      "user": {
        "id": 1,
        "username": "user@example.com",
        "email": "user@example.com",
        "sites": [
          {
            "id": 1,
            "name": "Marketing",
            "role": "editor"
          }
        ]
      }
    }
    ```

#### Current User
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Success Response**:
  - Status: `200 OK`
  - Content: User details as shown in login response

#### User Sites
- **URL**: `/api/auth/sites`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Success Response**:
  - Status: `200 OK`
  - Content:
    ```json
    {
      "sites": [
        {
          "id": 1,
          "name": "Marketing",
          "role": "editor"
        }
      ]
    }
    ```

#### Set Active Site
- **URL**: `/api/auth/site`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Request Body**:
  ```json
  {
    "siteId": 1
  }
  ```
- **Success Response**:
  - Status: `200 OK`
  - Content:
    ```json
    {
      "success": true,
      "currentSite": {
        "id": 1,
        "name": "Marketing"
      }
    }
    ```

### Interactions

#### List/Search Interactions
- **URL**: `/api/interactions`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Query Parameters**:
  - `search`: Search term
  - `sort`: Field to sort by
  - `direction`: Sort direction (`asc` or `desc`)
  - `page`: Page number
  - `pageSize`: Items per page
  - Field-specific filters: `type`, `lead`, etc.
- **Success Response**:
  - Status: `200 OK`
  - Content:
    ```json
    {
      "interactions": [
        {
          "id": 1,
          "title": "Client Meeting",
          "type": "Meeting",
          "lead": "Jane Smith",
          "startDateTime": "2023-08-15T09:00:00",
          "timezone": "America/New_York",
          "endDateTime": "2023-08-15T10:00:00",
          "location": "Conference Room A",
          "description": "Discussion about new marketing campaign",
          "notes": "Follow-up in one week",
          "createdAt": "2023-08-10T14:30:00",
          "updatedAt": "2023-08-10T14:30:00"
        }
      ],
      "total": 125,
      "page": 1,
      "pageSize": 25
    }
    ```

#### Get Single Interaction
- **URL**: `/api/interactions/{id}`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Success Response**:
  - Status: `200 OK`
  - Content: Single interaction object

#### Create Interaction
- **URL**: `/api/interactions`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Request Body**: Interaction data
- **Success Response**:
  - Status: `201 Created`
  - Content:
    ```json
    {
      "success": true,
      "interaction": {
        "id": 2,
        "title": "New Meeting",
        "type": "Meeting",
        "lead": "John Doe",
        "startDateTime": "2023-08-20T13:00:00",
        "timezone": "America/New_York",
        "endDateTime": "2023-08-20T14:00:00",
        "location": "Virtual",
        "description": "Planning session",
        "notes": "",
        "createdAt": "2023-08-15T10:20:00",
        "updatedAt": "2023-08-15T10:20:00"
      }
    }
    ```

#### Update Interaction
- **URL**: `/api/interactions/{id}`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Request Body**: Updated interaction data
- **Success Response**:
  - Status: `200 OK`
  - Content: Similar to create response

#### Delete Interaction
- **URL**: `/api/interactions/{id}`
- **Method**: `DELETE`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Success Response**:
  - Status: `200 OK`
  - Content:
    ```json
    {
      "success": true
    }
    ```

### Sites

#### List Sites
- **URL**: `/api/sites`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Success Response**:
  - Status: `200 OK`
  - Content:
    ```json
    {
      "sites": [
        {
          "id": 1,
          "name": "Marketing",
          "description": "Marketing department"
        }
      ]
    }
    ```

#### Get Site Details
- **URL**: `/api/sites/{id}`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {jwt_token}`
- **Success Response**:
  - Status: `200 OK`
  - Content: Single site object

### Error Handling

All API endpoints return standardized error responses:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data",
    "details": [
      {"field": "startDateTime", "message": "Must be a valid date"}
    ]
  }
}
```

Common error codes:
- `AUTHENTICATION_ERROR`: Authentication failure
- `AUTHORIZATION_ERROR`: Permission denied
- `VALIDATION_ERROR`: Invalid input data
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `INTERNAL_ERROR`: Server error

HTTP status codes follow standard conventions:
- 200: Success
- 201: Resource created
- 400: Bad request (validation error)
- 401: Unauthorized (authentication error)
- 403: Forbidden (authorization error)
- 404: Not found
- 500: Internal server error

## Database Migrations

The application uses Alembic for database migrations:

1. Create a new migration:
   ```
   flask db migrate -m "Description of changes"
   ```

2. Review the generated migration script in `database/migrations/versions/`.

3. Apply migrations:
   ```
   flask db upgrade
   ```

4. Revert to a previous version if needed:
   ```
   flask db downgrade
   ```

Migration best practices:
- Never modify existing migration scripts after they've been committed
- Test migrations thoroughly before applying to production
- Include data migrations when schema changes affect existing data
- Consider making complex changes across multiple migrations

## Testing

### Running Tests

1. Ensure the test database is created:
   ```
   createdb interaction_management_test
   ```

2. Run the test suite:
   ```
   pytest
   ```

3. Run tests with coverage report:
   ```
   pytest --cov=. --cov-report=term-missing
   ```

4. Run specific test modules:
   ```
   pytest tests/test_auth/
   ```

### Test Structure

Tests are organized by component:
- `tests/conftest.py`: Common fixtures
- `tests/test_auth/`: Authentication tests
- `tests/test_interactions/`: Interaction entity tests
- `tests/test_sites/`: Site management tests

Each test file focuses on a specific functionality:
- Unit tests for service and utility functions
- Integration tests for API endpoints
- Functional tests for complete flows

### Writing Tests

Guidelines for writing effective tests:
1. Use fixtures for setup and teardown
2. Isolate tests from each other
3. Mock external dependencies
4. Test both success and failure cases
5. Verify side effects (e.g., database changes)
6. Use parameterized tests for similar test cases with different inputs

Example test:
```python
def test_create_interaction(client, auth_token, test_interaction):
    """Test creating a new interaction."""
    response = client.post(
        "/api/interactions",
        json=test_interaction,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    assert response.json["success"] is True
    assert "id" in response.json["interaction"]
    assert response.json["interaction"]["title"] == test_interaction["title"]
```

## Key Features

### Site-Scoped Multi-tenancy

The system implements site-scoping as a core security mechanism:

1. **Data Isolation**: Each interaction belongs to exactly one site
2. **Automatic Filtering**: All queries automatically filter by the user's active site
3. **Context Management**: Site context is maintained through JWT claims and request context
4. **Permission Boundaries**: Users can only access interactions from sites they're associated with

Implementation details:
- Site context middleware injects site_id into all queries
- Database models include site_id foreign key
- JWT tokens include site access claims
- API endpoints verify site access before operations

### Authentication and Authorization

The authentication system uses JWT tokens with site-scoped claims:

1. **Token-based Authentication**: Stateless JWT tokens for authentication
2. **Role-based Access Control**: Different permission levels (admin, editor, viewer)
3. **Site Association**: Users are associated with one or more sites
4. **Context Switching**: Users can switch between sites they have access to

Security features:
- Tokens expire after 24 hours
- Passwords stored using bcrypt hashing
- Rate limiting on authentication endpoints
- Comprehensive logging of authentication events

### Interaction Management

The Interaction entity is the core data model:

1. **Complete CRUD Operations**: Create, read, update, delete functionality
2. **Validation Rules**: Comprehensive validation for all fields
3. **Audit Trail**: Created/updated timestamps and user tracking
4. **Site Association**: Every interaction belongs to a specific site

Data integrity features:
- Transaction management for multi-step operations
- Consistent validation across all operations
- Properly enforced relationships between entities

### Search Functionality

The search system for the Finder interface provides:

1. **Global Search**: Search across all text fields
2. **Field-specific Filters**: Filter by specific fields
3. **Sorting**: Sort by any field, ascending or descending
4. **Pagination**: Efficient handling of large result sets

Performance optimizations:
- Database indexes on searchable fields
- Optimized query construction
- Result caching for common searches
- Efficient pagination implementation

## Development Guidelines

### Coding Standards

1. Follow PEP 8 style guidelines
2. Use type hints wherever possible
3. Write docstrings for all modules, classes, and functions
4. Maintain test coverage for new code (minimum 80%)

### Development Workflow

1. Work in feature branches named `feature/description` or `bugfix/description`
2. Write tests before implementing features
3. Run tests locally before submitting pull requests
4. Follow conventional commit message format
5. Request code reviews for all changes

### API Design Guidelines

1. Follow RESTful conventions
2. Use appropriate HTTP methods and status codes
3. Provide consistent error responses
4. Implement proper validation
5. Document all endpoints

### Security Guidelines

1. Never store sensitive information in code
2. Validate all input data
3. Use parameterized queries to prevent SQL injection
4. Apply the principle of least privilege
5. Log security-relevant events

## Troubleshooting

### Common Issues

#### Database Connection Problems
- Verify PostgreSQL is running: `pg_isready`
- Check connection string in `.env` file
- Ensure database user has appropriate permissions

#### Authentication Issues
- Verify JWT secret keys match across environments
- Check token expiration settings
- Clear browser storage to reset tokens

#### Performance Problems
- Enable query logging to identify slow queries
- Check Redis connection for caching issues
- Monitor database connection pool usage

### Logging

Logs are written to:
- Console during development
- Log files in production (configured via environment variables)
- CloudWatch when deployed on AWS

Adjust log level in the `.env` file:
```
LOG_LEVEL=DEBUG  # For more verbose logging
```

### Getting Help

For additional help:
1. Check the issue tracker for similar problems
2. Consult the internal documentation wiki
3. Contact the development team for assistance

## License

Copyright (c) 2023 Your Organization

All rights reserved. This software is the confidential and proprietary information of Your Organization. You shall not disclose such confidential information and shall use it only in accordance with the terms of the license agreement you entered into with Your Organization.