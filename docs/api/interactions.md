# Interactions API

## Overview
Documentation for interaction endpoints that enable creating, reading, updating, and deleting interaction records, as well as searching and filtering interactions within the site context.

## Base URL
All interaction endpoints are prefixed with `/api/interactions`.

## Authentication Requirements
All interaction endpoints require authentication via JWT token in the Authorization header and an active site context. Refer to the [Authentication API](auth.md) documentation for details on obtaining tokens and setting the site context.

## Data Model
The Interaction entity contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier |
| site_id | number | Associated site |
| title | string | Required |
| type | string | Required, one of predefined types |
| lead | string | Required, person leading the interaction |
| start_datetime | string | Required, ISO 8601 format |
| timezone | string | Required, IANA timezone format |
| end_datetime | string | Optional, ISO 8601 format |
| location | string | Optional |
| description | string | Optional |
| notes | string | Optional |
| created_by | number | User ID |
| created_at | string | ISO 8601 format |
| updated_by | number | User ID, if updated |
| updated_at | string | ISO 8601 format, if updated |

## Interaction Endpoints

### List Interactions
#### `GET /api/interactions`

Retrieves a paginated list of interactions for the current site context with optional filtering, sorting, and pagination parameters.

**Request Headers:**
- `Authorization`: Bearer {token}

**Query Parameters:**
- `search`: string (optional, search term across all fields)
- `title`: string (optional, filter by title)
- `type`: string (optional, filter by type)
- `lead`: string (optional, filter by lead)
- `start_date`: string (optional, filter by start date range, ISO format)
- `end_date`: string (optional, filter by end date range, ISO format)
- `location`: string (optional, filter by location)
- `page`: number (optional, defaults to 1)
- `per_page`: number (optional, defaults to 25)
- `sort_by`: string (optional, field to sort by)
- `sort_direction`: string (optional, 'asc' or 'desc', defaults to 'desc')

**Response:**
- Status: 200 OK
- Content-Type: application/json

```json
{
  "status": "success",
  "data": {
    "interactions": [
      {
        "id": 42,
        "site_id": 1,
        "title": "Client Meeting",
        "type": "Meeting",
        "lead": "John Smith",
        "start_datetime": "2023-08-15T14:00:00Z",
        "timezone": "America/New_York",
        "end_datetime": "2023-08-15T15:30:00Z",
        "location": "Conference Room A",
        "description": "Quarterly review meeting with client",
        "notes": "Prepare quarterly reports",
        "created_by": 5,
        "created_at": "2023-08-10T09:23:15Z",
        "updated_by": null,
        "updated_at": null
      },
      // Additional interactions...
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total_pages": 5,
      "total_records": 42
    }
  }
}
```

**Errors:**
- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Authentication required
- 403 Forbidden: Site context required

**Example:**
```bash
curl -X GET 'https://api.example.com/api/interactions?page=1&per_page=10&sort_by=created_at&sort_direction=desc' \
  -H 'Authorization: Bearer {token}'
```

### Get Interaction
#### `GET /api/interactions/{id}`

Retrieves a single interaction by ID.

**Request Headers:**
- `Authorization`: Bearer {token}

**Path Parameters:**
- `id`: number (required, interaction ID)

**Response:**
- Status: 200 OK
- Content-Type: application/json

```json
{
  "status": "success",
  "data": {
    "interaction": {
      "id": 42,
      "site_id": 1,
      "title": "Client Meeting",
      "type": "Meeting",
      "lead": "John Smith",
      "start_datetime": "2023-08-15T14:00:00Z",
      "timezone": "America/New_York",
      "end_datetime": "2023-08-15T15:30:00Z",
      "location": "Conference Room A",
      "description": "Quarterly review meeting with client",
      "notes": "Prepare quarterly reports",
      "created_by": 5,
      "created_at": "2023-08-10T09:23:15Z",
      "updated_by": null,
      "updated_at": null
    }
  }
}
```

**Errors:**
- 401 Unauthorized: Authentication required
- 403 Forbidden: Site context required
- 404 Not Found: Interaction not found

**Example:**
```bash
curl -X GET 'https://api.example.com/api/interactions/42' \
  -H 'Authorization: Bearer {token}'
```

### Create Interaction
#### `POST /api/interactions`

Creates a new interaction record for the current site context.

**Request Headers:**
- `Authorization`: Bearer {token}
- `Content-Type`: application/json

**Request Body:**
```json
{
  "title": "Client Meeting",
  "type": "Meeting",
  "lead": "John Smith",
  "start_datetime": "2023-08-15T14:00:00Z",
  "timezone": "America/New_York",
  "end_datetime": "2023-08-15T15:30:00Z",
  "location": "Conference Room A",
  "description": "Quarterly review meeting with client",
  "notes": "Prepare quarterly reports"
}
```

**Response:**
- Status: 201 Created
- Content-Type: application/json

```json
{
  "status": "success",
  "data": {
    "interaction": {
      "id": 42,
      "site_id": 1,
      "title": "Client Meeting",
      "type": "Meeting",
      "lead": "John Smith",
      "start_datetime": "2023-08-15T14:00:00Z",
      "timezone": "America/New_York",
      "end_datetime": "2023-08-15T15:30:00Z",
      "location": "Conference Room A",
      "description": "Quarterly review meeting with client",
      "notes": "Prepare quarterly reports",
      "created_by": 5,
      "created_at": "2023-08-10T09:23:15Z",
      "updated_by": null,
      "updated_at": null
    }
  }
}
```

**Errors:**
- 400 Bad Request: Invalid request data
- 401 Unauthorized: Authentication required
- 403 Forbidden: Site context required

**Example:**
```bash
curl -X POST 'https://api.example.com/api/interactions' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Client Meeting",
    "type": "Meeting",
    "lead": "John Smith",
    "start_datetime": "2023-08-15T14:00:00Z",
    "timezone": "America/New_York",
    "end_datetime": "2023-08-15T15:30:00Z",
    "location": "Conference Room A",
    "description": "Quarterly review meeting with client",
    "notes": "Prepare quarterly reports"
  }'
```

### Update Interaction
#### `PUT /api/interactions/{id}`

Updates an existing interaction record.

**Request Headers:**
- `Authorization`: Bearer {token}
- `Content-Type`: application/json

**Path Parameters:**
- `id`: number (required, interaction ID)

**Request Body:**
```json
{
  "title": "Updated Client Meeting",
  "description": "Updated quarterly review meeting with client"
}
```

**Response:**
- Status: 200 OK
- Content-Type: application/json

```json
{
  "status": "success",
  "data": {
    "interaction": {
      "id": 42,
      "site_id": 1,
      "title": "Updated Client Meeting",
      "type": "Meeting",
      "lead": "John Smith",
      "start_datetime": "2023-08-15T14:00:00Z",
      "timezone": "America/New_York",
      "end_datetime": "2023-08-15T15:30:00Z",
      "location": "Conference Room A",
      "description": "Updated quarterly review meeting with client",
      "notes": "Prepare quarterly reports",
      "created_by": 5,
      "created_at": "2023-08-10T09:23:15Z",
      "updated_by": 5,
      "updated_at": "2023-08-11T10:45:32Z"
    }
  }
}
```

**Errors:**
- 400 Bad Request: Invalid request data
- 401 Unauthorized: Authentication required
- 403 Forbidden: Site context required
- 404 Not Found: Interaction not found

**Example:**
```bash
curl -X PUT 'https://api.example.com/api/interactions/42' \
  -H 'Authorization: Bearer {token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Client Meeting",
    "description": "Updated quarterly review meeting with client"
  }'
```

### Delete Interaction
#### `DELETE /api/interactions/{id}`

Deletes an interaction record.

**Request Headers:**
- `Authorization`: Bearer {token}

**Path Parameters:**
- `id`: number (required, interaction ID)

**Response:**
- Status: 200 OK
- Content-Type: application/json

```json
{
  "status": "success",
  "data": {
    "success": true,
    "message": "Interaction deleted successfully"
  }
}
```

**Errors:**
- 401 Unauthorized: Authentication required
- 403 Forbidden: Site context required
- 404 Not Found: Interaction not found

**Example:**
```bash
curl -X DELETE 'https://api.example.com/api/interactions/42' \
  -H 'Authorization: Bearer {token}'
```

### Get Interaction Types
#### `GET /api/interactions/types`

Retrieves the list of valid interaction types.

**Request Headers:**
- `Authorization`: Bearer {token}

**Response:**
- Status: 200 OK
- Content-Type: application/json

```json
{
  "status": "success",
  "data": {
    "types": ["Meeting", "Call", "Email", "Update", "Review", "Training"]
  }
}
```

**Errors:**
- 401 Unauthorized: Authentication required

**Example:**
```bash
curl -X GET 'https://api.example.com/api/interactions/types' \
  -H 'Authorization: Bearer {token}'
```

## Search and Filtering

The Interaction API supports multiple search and filtering capabilities through the query parameters of the List Interactions endpoint.

**Filtering Options:**
- Global search: Use the `search` parameter to search across all text fields
- Field-specific filtering: Use field-specific parameters like `title`, `type`, `lead`, etc.
- Date range filtering: Use `start_date` and `end_date` parameters to filter by date ranges
- Sorting: Use `sort_by` parameter with a field name and `sort_direction` with 'asc' or 'desc'

**Example:**
```bash
# Search for all meetings led by John between June 1 and July 31, 2023
curl -X GET 'https://api.example.com/api/interactions?type=Meeting&lead=John&start_date=2023-06-01T00:00:00Z&end_date=2023-07-31T23:59:59Z' \
  -H 'Authorization: Bearer {token}'
```

## Pagination

The List Interactions endpoint supports pagination through the following query parameters:

- `page`: Page number to retrieve (default: 1)
- `per_page`: Number of records per page (default: 25, max: 100)

The response includes pagination metadata in the `meta.pagination` object:

```json
"meta": {
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total_pages": 5,
    "total_records": 102
  }
}
```

**Example:**
```bash
# Get page 2 with 10 records per page
curl -X GET 'https://api.example.com/api/interactions?page=2&per_page=10' \
  -H 'Authorization: Bearer {token}'
```

## Error Handling

All interaction endpoints return standard HTTP status codes with structured JSON error responses.

**Error Response Format:**
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "message": "validation error message"
      }
    ]
  }
}
```

**Common Errors:**
- 400 Bad Request - Missing or invalid parameters
- 401 Unauthorized - Invalid or expired token
- 403 Forbidden - Missing site context or insufficient permissions
- 404 Not Found - Requested interaction not found
- 500 Internal Server Error - Server-side error

## Site Context Enforcement

All interaction endpoints enforce site-scoping to ensure users can only access interactions from their authorized sites. When making requests, the system automatically applies the current site context to filter the data. Attempting to access interactions from unauthorized sites will result in a 404 Not Found error, maintaining strict data isolation between sites.

This implementation ensures:
- Users can only view and manage interactions from their associated sites
- All queries are automatically filtered by the current site context
- Interaction operations (create, read, update, delete) respect site boundaries
- Multi-tenant data isolation is maintained at the API level