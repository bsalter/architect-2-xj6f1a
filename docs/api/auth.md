# Authentication API

## Overview

Documentation for authentication endpoints that enable user authentication, site context management, and session handling.

## Base URL

All authentication endpoints are prefixed with `/api/auth`.

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user and returns a JWT token along with user information and available sites.

**Request:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john.doe@example.com"
  },
  "sites": [
    {
      "id": 1,
      "name": "Marketing",
      "description": "Marketing department site",
      "role": "Editor"
    },
    {
      "id": 2,
      "name": "Sales",
      "description": "Sales department site",
      "role": "Viewer"
    }
  ]
}
```

**Errors:**
- `400 Bad Request`: Username and password required
- `401 Unauthorized`: Invalid credentials

**Example:**
```bash
curl -X POST https://api.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john.doe", "password": "secure_password"}'
```

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Retrieves the current authenticated user's details.

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:** (200 OK)
```json
{
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john.doe@example.com"
  }
}
```

**Errors:**
- `401 Unauthorized`: Unauthorized
- `404 Not Found`: User not found

**Example:**
```bash
curl -X GET https://api.example.com/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get User Sites

**Endpoint:** `GET /api/auth/sites`

**Description:** Retrieves the list of sites associated with the current user.

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:** (200 OK)
```json
{
  "sites": [
    {
      "id": 1,
      "name": "Marketing",
      "description": "Marketing department site",
      "role": "Editor"
    },
    {
      "id": 2,
      "name": "Sales",
      "description": "Sales department site",
      "role": "Viewer"
    }
  ]
}
```

**Errors:**
- `401 Unauthorized`: Unauthorized

**Example:**
```bash
curl -X GET https://api.example.com/api/auth/sites \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Set Site Context

**Endpoint:** `POST /api/auth/site`

**Description:** Sets the active site context for the current user session.

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "siteId": 1
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "currentSite": {
    "id": 1,
    "name": "Marketing",
    "description": "Marketing department site",
    "role": "Editor"
  }
}
```

**Errors:**
- `400 Bad Request`: Site ID required
- `401 Unauthorized`: Unauthorized
- `403 Forbidden`: User does not have access to this site

**Example:**
```bash
curl -X POST https://api.example.com/api/auth/site \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"siteId": 1}'
```

### Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logs out the current user by invalidating their JWT token.

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Errors:**
- `401 Unauthorized`: Unauthorized

**Example:**
```bash
curl -X POST https://api.example.com/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Authentication Flow

The typical authentication workflow follows these steps:

1. User submits credentials via `POST /api/auth/login`
2. System validates credentials and returns JWT token with user details and available sites
3. For users with multiple sites, client redirects to site selection page
4. User selects a site, client sets the site context via `POST /api/auth/site`
5. JWT token is included in all subsequent API requests in the Authorization header
6. When finished, user logs out via `POST /api/auth/logout`

This flow ensures that users are properly authenticated and have the appropriate site context before accessing protected resources.

## Error Handling

All authentication endpoints return standard HTTP status codes with JSON error responses in the following format:

```json
{
  "error": "Error message description"
}
```

Common error status codes:

- `400 Bad Request`: Missing or invalid parameters
- `401 Unauthorized`: Invalid or expired credentials/token
- `403 Forbidden`: Insufficient permissions for the requested operation
- `404 Not Found`: Requested resource not found
- `500 Internal Server Error`: Server-side error

When handling errors in client applications, always check the status code and display appropriate messages to the user.

## Security Considerations

When implementing authentication in client applications, follow these best practices:

- Store JWT tokens securely (HttpOnly cookies or secure browser storage)
- Include tokens in the Authorization header for all API requests
- Implement proper token expiration handling
- Clear tokens on logout
- Use HTTPS for all API requests to prevent token interception

The JWT token has a default expiration of 24 hours. Clients should handle token expiration by redirecting to the login page when receiving a 401 Unauthorized response.