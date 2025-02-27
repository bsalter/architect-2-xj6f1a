# Sites API

The Sites API provides endpoints for managing and interacting with sites in the Interaction Management System. Sites represent organizational units that contain collections of users and interactions, providing boundaries for data access.

## Authentication

All endpoints in the Sites API require authentication using a valid JWT token. Include the token in the Authorization header of your requests:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### List Available Sites

Retrieves all sites that the authenticated user has access to.

**URL**: `/api/sites`

**Method**: `GET`

**Auth required**: Yes

**Permissions required**: Authenticated user

#### Request

**Headers**:

| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer {JWT token} |

#### Success Response

**Code**: `200 OK`

**Content example**:

```json
{
  "status": "success",
  "data": {
    "sites": [
      {
        "id": 1,
        "name": "Marketing",
        "description": "Marketing department site",
        "is_active": true,
        "user_role": "Administrator"
      },
      {
        "id": 2,
        "name": "Sales",
        "description": "Sales team site",
        "is_active": true,
        "user_role": "Editor"
      },
      {
        "id": 3,
        "name": "Support",
        "description": "Customer support site",
        "is_active": true,
        "user_role": "Viewer"
      }
    ]
  }
}
```

#### Error Responses

**Code**: `401 Unauthorized`

**Content example**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

#### Example

```bash
curl -X GET \
  https://api.example.com/api/sites \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

---

### Get Site Details

Retrieves detailed information about a specific site.

**URL**: `/api/sites/{site_id}`

**Method**: `GET`

**Auth required**: Yes

**Permissions required**: Access to the specified site

#### URL Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| site_id | Yes | The ID of the site to retrieve |

#### Request

**Headers**:

| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer {JWT token} |

#### Success Response

**Code**: `200 OK`

**Content example**:

```json
{
  "status": "success",
  "data": {
    "site": {
      "id": 1,
      "name": "Marketing",
      "description": "Marketing department site",
      "is_active": true,
      "created_at": "2023-06-15T10:00:00Z",
      "user_count": 15,
      "interaction_count": 248,
      "user_role": "Administrator"
    }
  }
}
```

#### Error Responses

**Code**: `401 Unauthorized`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

**Code**: `403 Forbidden`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You do not have access to this site"
  }
}
```

**Code**: `404 Not Found`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Site not found"
  }
}
```

#### Example

```bash
curl -X GET \
  https://api.example.com/api/sites/1 \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

---

### List Site Users

Retrieves a list of users associated with a specific site.

**URL**: `/api/sites/{site_id}/users`

**Method**: `GET`

**Auth required**: Yes

**Permissions required**: Administrator role on the specified site

#### URL Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| site_id | Yes | The ID of the site to retrieve users for |

#### Request

**Headers**:

| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer {JWT token} |

#### Success Response

**Code**: `200 OK`

**Content example**:

```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 101,
        "username": "jsmith",
        "email": "john.smith@example.com",
        "role": "Administrator",
        "last_login": "2023-08-10T14:30:22Z",
        "is_active": true
      },
      {
        "id": 102,
        "username": "ajones",
        "email": "alice.jones@example.com",
        "role": "Editor",
        "last_login": "2023-08-11T09:15:45Z",
        "is_active": true
      },
      {
        "id": 103,
        "username": "bgarcia",
        "email": "bob.garcia@example.com",
        "role": "Viewer",
        "last_login": "2023-08-09T16:42:18Z",
        "is_active": true
      }
    ],
    "total": 3,
    "page": 1,
    "total_pages": 1
  }
}
```

#### Error Responses

**Code**: `401 Unauthorized`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

**Code**: `403 Forbidden`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Administrator role required to view site users"
  }
}
```

**Code**: `404 Not Found`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Site not found"
  }
}
```

#### Example

```bash
curl -X GET \
  https://api.example.com/api/sites/1/users \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

---

### Set Active Site Context

Sets the active site context for the current user session. This affects which site's data will be displayed and modified in subsequent API calls.

**URL**: `/api/sites/active`

**Method**: `POST`

**Auth required**: Yes

**Permissions required**: Access to the specified site

#### Request

**Headers**:

| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer {JWT token} |
| Content-Type | Yes | application/json |

**Body**:

```json
{
  "site_id": 2
}
```

#### Success Response

**Code**: `200 OK`

**Content example**:

```json
{
  "status": "success",
  "data": {
    "message": "Site context updated successfully",
    "current_site": {
      "id": 2,
      "name": "Sales",
      "description": "Sales team site",
      "user_role": "Editor"
    }
  }
}
```

#### Error Responses

**Code**: `400 Bad Request`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "site_id",
        "message": "site_id is required"
      }
    ]
  }
}
```

**Code**: `401 Unauthorized`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Authentication required"
  }
}
```

**Code**: `403 Forbidden`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You do not have access to this site"
  }
}
```

**Code**: `404 Not Found`

**Content**:

```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Site not found"
  }
}
```

#### Example

```bash
curl -X POST \
  https://api.example.com/api/sites/active \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "site_id": 2
  }'
```

## Status Codes

The Sites API returns the following status codes:

| Status Code | Description |
|-------------|-------------|
| 200 | OK - The request was successful |
| 400 | Bad Request - The request contains invalid data |
| 401 | Unauthorized - Authentication is required or invalid |
| 403 | Forbidden - You do not have the necessary permissions |
| 404 | Not Found - The requested resource was not found |
| 500 | Internal Server Error - An unexpected error occurred |

## Important Notes

1. **Site Context**: All data operations in the Interaction Management System are automatically scoped to the active site context. After setting a new active site, all subsequent API calls will operate within that site's context.

2. **Multiple Site Access**: Users may have access to multiple sites with different roles in each. The `user_role` field in site responses indicates the user's role in that specific site.

3. **Site Switching**: Changing the active site context does not require re-authentication, but it does change which data the user can access and modify.