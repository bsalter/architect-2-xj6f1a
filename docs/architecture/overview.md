# System Architecture Overview

## Introduction

This document provides a high-level architectural overview of the Interaction Management System. It serves as the entry point for detailed architecture documentation, guiding development and understanding of the system's structure and components.

### Purpose

The Interaction Management System aims to streamline interaction management across organizational sites, providing a centralized, searchable system to track various interactions with controlled user access.

### Scope

This document covers the system's:
- Architectural approach
- Component structure
- Data flow
- Technology stack
- Security framework

## Architectural Approach

The Interaction Management System follows a multi-tier web application architecture, balancing simplicity with resilience and scalability. The system is designed with clear separation of concerns, enabling independent scaling of frontend and backend components.

### Key Principles

- **Separation of Concerns**: Frontend and backend are decoupled, communicating only via defined API contracts.
- **Site-Based Multi-Tenancy**: Data isolation occurs at the application layer through site-scoping filters.
- **Stateless Backend**: Authentication state is maintained via tokens, allowing for horizontal scaling.
- **Progressive Enhancement**: Core functionality works with minimal JavaScript, with enhanced features for modern browsers.

## Component Structure

The system consists of the following core components:

- **Frontend**: A React-based single-page application (SPA) providing the user interface.
- **API Gateway**: A Flask-based RESTful API handling business logic and data operations.
- **Database**: A PostgreSQL database with a structured schema for storing interactions, users, and sites.
- **Caching Layer**: Redis for caching frequently accessed data like user sessions and common searches.
- **External Services**: Integration with Auth0 for authentication, AWS S3 for static asset storage, and AWS CloudWatch for logging and monitoring.

![System Architecture Diagram](./diagrams/system_architecture.png)

### Component Details

- **Frontend Application**: Manages user interface and client-side state. See [Frontend Architecture](./frontend.md) for details.
- **API Gateway**: Serves as the entry point for all client requests, handling authentication verification, request routing, and response formatting. See [Backend Architecture](./backend.md) for details.
- **Interaction Service**: Handles all CRUD operations for interaction records, enforcing business rules, validation, and site-scoping. See [Backend Architecture](./backend.md) for details.
- **Site Context Manager**: Ensures all data operations are properly scoped to the user's authorized sites, maintaining multi-tenant data isolation. See [Backend Architecture](./backend.md) for details.
- **Database Layer**: Provides structured storage for all application data with proper relationships between entities. See [Database Architecture](./database.md) for details.

![Component Diagram](./diagrams/component_diagram.png)

## Data Flow

The primary data flow begins with user authentication, where credentials are verified, and site associations are loaded into the session context. Once authenticated, the site context becomes a mandatory filter for all subsequent data operations.

For the Finder view, interaction data flows from the database through the API gateway, with the site context automatically applied as a filter at the service layer. Search parameters and pagination information flow from the frontend to the backend, with result sets returned as paginated JSON responses.

When creating or editing an interaction, form data flows from the frontend to the validation layer, which enforces business rules before persisting changes to the database. All interactions are automatically associated with the user's active site context.

The system employs a request-response pattern over HTTPS using JSON as the primary data exchange format. Authentication state is maintained via JWT tokens stored in secure browser storage, with the token included in the Authorization header of all API requests.

## Technology Stack

The system utilizes the following technology stack:

- **Frontend**: React, TypeScript, TailwindCSS, React Router, React Query, React Hook Form, date-fns
- **Backend**: Python, Flask, SQLAlchemy, Flask-JWT-Extended, Flask-CORS, marshmallow
- **Database**: PostgreSQL, Alembic, PgBouncer, Redis

## Security Framework

The security architecture employs defense in depth with multiple layers of protection. JWT is used for authentication, eliminating the need for server-side session storage and allowing for stateless horizontal scaling. Site-scoping is implemented in middleware to ensure consistent application across all data operations, with no possibility of bypassing this critical security control.

See [Security Architecture](./security.md) for details.

## Monitoring and Observability

The system implements a comprehensive monitoring strategy focused on application health, performance metrics, error rates, and user activity. Monitoring is implemented through AWS CloudWatch with custom dashboards providing visibility into system-wide health indicators, component-specific performance metrics, error trends and anomalies, and user engagement patterns.

See [Monitoring Architecture](./monitoring.md) for details.

## Network Architecture

The network architecture is designed for security, high availability, and scalability. It includes a multi-AZ deployment, load balancing, and CDN for static assets.

![Network Diagram](./diagrams/network_diagram.png)