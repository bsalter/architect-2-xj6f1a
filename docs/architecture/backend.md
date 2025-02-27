# Backend Architecture Documentation
## Interaction Management System

## 1. Overview

This document provides a comprehensive overview of the backend architecture for the Interaction Management System. It details the technology stack, application structure, design patterns, API layer, authentication and authorization mechanisms, and other key backend aspects. This document is intended for developers and architects involved in the development, deployment, and maintenance of the system.

The backend is responsible for:
- Handling user authentication and authorization
- Managing interaction data (CRUD operations)
- Enforcing site-scoped access control
- Providing a RESTful API for the frontend
- Implementing business logic and data validation

## 2. Technology Stack

The backend is built using the following technologies:

- **Python**: Programming language for the backend API
- **Flask** <!-- 2.3.2 -->: Lightweight web framework for building the API
- **SQLAlchemy** <!-- 2.0.19 -->: ORM for database interactions
- **Flask-JWT-Extended** <!-- 4.5.2 -->: JWT authentication for secure user sessions
- **Flask-Migrate** <!-- 4.0.4 -->: Database migration support
- **Marshmallow** <!-- 3.20.1 -->: Data serialization and validation
- **Flask-CORS** <!-- 4.0.0 -->: CORS support for cross-origin requests
- **PostgreSQL**: Relational database for storing interaction data
- **Redis** <!-- 4.6.0 -->: Caching and token blacklisting
- **Flask-Limiter** <!-- 3.3.1 -->: API rate limiting

## 3. Application Structure

The backend application follows a modular structure with clear separation of concerns:

```
src/backend/
├── api/              # API routes and controllers
├── auth/             # Authentication and authorization logic
├── config.py         # Application configuration
├── database/         # Database models and migrations
├── extensions.py     # Flask extension initialization
├── interactions/     # Interaction resource logic
├── sites/            # Site management logic
├── utils/            # Utility functions and helpers
├── app.py            # Application factory
```

### 3.1 Component Details

- **api**: Contains the API blueprint, route definitions, and controller functions for handling incoming requests.
- **auth**: Implements authentication and authorization logic, including user models, token management, and middleware.
- **config.py**: Defines application configuration settings for different environments (development, testing, production).
- **database**: Contains SQLAlchemy models representing database tables and Alembic migrations for schema management.
- **extensions.py**: Initializes Flask extensions such as SQLAlchemy, JWTManager, CORS, and Marshmallow.
- **interactions**: Implements the core interaction resource logic, including data models, validation schemas, and service functions.
- **sites**: Manages site-related operations, including site creation, retrieval, and user-site associations.
- **utils**: Provides utility functions for logging, security, validation, and other common tasks.
- **app.py**: Contains the Flask application factory function that creates and configures the main application instance.

## 4. Design Patterns

The backend architecture utilizes several design patterns to ensure maintainability, scalability, and security:

- **Multi-Tier Architecture**: The application is structured into distinct layers (presentation, application, data) to separate concerns and improve maintainability.
- **RESTful API**: The API follows REST principles with resource-oriented endpoints and standard HTTP methods.
- **Service Layer**: Business logic is encapsulated in service classes that act as intermediaries between controllers and data access layers.
- **Repository Pattern**: Data access logic is abstracted into repository classes that handle database interactions.
- **Data Transfer Objects (DTOs)**: Marshmallow schemas are used as DTOs to validate and serialize data between layers.
- **Middleware**: Authentication, authorization, and site-scoping are implemented as middleware components that intercept requests and enforce security policies.
- **Factory Pattern**: The Flask application instance is created using a factory function to allow for flexible configuration and testing.

## 5. API Layer

The API layer is built using Flask and follows RESTful principles. It consists of the following components:

- **API Blueprint**: A Flask Blueprint named `api_bp` that registers all API routes.
- **Route Definitions**: URL endpoints that map to specific controller functions.
- **Controller Functions**: Functions that handle incoming requests, process data, and return responses.
- **Request and Response Formats**: JSON is used as the primary data exchange format.
- **HTTP Methods**: Standard HTTP methods (GET, POST, PUT, DELETE) are used to perform CRUD operations.
- **Status Codes**: Standard HTTP status codes are used to indicate the success or failure of requests.

### 5.1 API Endpoints

The following table lists the main API endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Authenticates a user and returns a JWT token. |
| `/api/auth/me` | GET | Retrieves information about the currently authenticated user. |
| `/api/auth/sites` | GET | Retrieves a list of sites associated with the current user. |
| `/api/auth/site` | POST | Sets the active site context for the current user. |
| `/api/auth/logout` | POST | Logs out the current user by invalidating their JWT token. |
| `/api/interactions` | GET | Retrieves a list of interactions with optional filtering and pagination. |
| `/api/interactions/{id}` | GET | Retrieves a single interaction by ID. |
| `/api/interactions` | POST | Creates a new interaction. |
| `/api/interactions/{id}` | PUT | Updates an existing interaction. |
| `/api/interactions/{id}` | DELETE | Deletes an interaction. |
| `/api/interactions/types` | GET | Retrieves a list of valid interaction types. |
| `/api/sites` | GET | Retrieves a list of sites. |
| `/api/sites/{id}` | GET | Retrieves a single site by ID. |
| `/api/sites/{id}/users` | GET | Retrieves a list of users associated with a specific site. |

### 5.2 Request and Response Formats

All API requests and responses use JSON as the data exchange format. Requests should include a `Content-Type` header set to `application/json`. Responses will also include a `Content-Type` header set to `application/json`.

#### 5.2.1 Request Example

```json
{
  "username": "testuser",
  "password": "password123"
}
```

#### 5.2.2 Response Example

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

### 5.3 Error Handling

The API implements standardized error responses using HTTP status codes and JSON error messages. See `src/backend/api/error_handlers.py` for details.

## 6. Authentication and Authorization

The backend implements JWT-based authentication and site-scoped authorization to secure the API and protect sensitive data.

### 6.1 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API Gateway
    participant Authentication Service
    participant Database

    User->>Client: Enters credentials
    Client->>API Gateway: POST /api/auth/login
    API Gateway->>Authentication Service: Validate credentials
    Authentication Service->>Database: Query user record
    Database-->>Authentication Service: Return user data
    Authentication Service->>Authentication Service: Generate JWT
    Authentication Service-->>API Gateway: Return JWT
    API Gateway-->>Client: Return JWT
    Client->>Client: Store JWT securely

    Note over Client,API Gateway: Subsequent requests
    Client->>API Gateway: Request with JWT
    API Gateway->>Authentication Service: Validate JWT
    Authentication Service-->>API Gateway: User context
    API Gateway->>API Gateway: Apply site-scoping
    API Gateway->>Database: Query with site filter
    Database-->>API Gateway: Return data
    API Gateway-->>Client: Return data