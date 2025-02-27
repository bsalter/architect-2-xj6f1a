# Interaction Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI Status](https://github.com/your-org/interaction-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/interaction-management-system/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)](https://sonarcloud.io/dashboard?id=your-org_interaction-management-system)

A modern web application for managing and viewing Interaction records across multiple organizational sites with a searchable table interface ("Finder") and a dedicated add/edit form.

## Overview

The Interaction Management System addresses the need for a centralized, searchable system to track various interactions across multiple sites with controlled user access. It provides a secure, multi-tenant environment where users can create, view, edit, and search interactions within their authorized sites.

## Key Features

- **Authentication & Authorization**: Secure login system with site-scoped access control
- **Multi-Site Support**: Support for multiple organizational sites with data isolation
- **Interaction Management**: Comprehensive form interface for creating and editing interaction records
- **Advanced Search**: Powerful search and filtering capabilities through the Finder interface
- **Responsive Design**: Optimized user experience across desktop and mobile devices
- **Type Safety**: Built with TypeScript and strict data validation

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 4.9.5
- React Router 6.14.2
- React Query 4.29.5
- React Hook Form 7.45.1
- TailwindCSS 3.3.3
- date-fns 2.30.0

### Backend
- Python 3.11
- Flask 2.3.2
- SQLAlchemy 2.0.19
- Flask-JWT-Extended 4.5.2
- Marshmallow 3.20.1

### Database & Storage
- PostgreSQL 15.3
- Redis 7.0.12 (caching)
- AWS S3 (static assets)

### DevOps & Infrastructure
- Docker & Docker Compose
- AWS (ECS, RDS, ElastiCache)
- GitHub Actions (CI/CD)
- Terraform (Infrastructure as Code)

## Getting Started

Follow these steps to set up the Interaction Management System for development:

**Prerequisites**
- Node.js 18.x and npm
- Python 3.11
- PostgreSQL 15.3
- Redis 7.0.12
- Docker and Docker Compose (optional)

**Quick Start with Docker**
```bash
# Clone the repository
git clone https://github.com/your-org/interaction-management-system.git
cd interaction-management-system

# Configure environment variables
cp src/backend/.env.example src/backend/.env
cp src/web/.env.example src/web/.env

# Start the application with Docker Compose
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

**Manual Setup**
For detailed instructions on manual setup, see [Development Setup Guide](docs/guides/development_setup.md)

## Project Structure

```
/
├── src/
│   ├── backend/       # Flask API backend
│   │   ├── api/       # API routes and controllers
│   │   ├── auth/      # Authentication services
│   │   ├── database/  # Database models and migrations
│   │   ├── interactions/ # Interaction services
│   │   ├── sites/     # Site management services
│   │   └── utils/     # Utility functions
│   └── web/           # React frontend
│       ├── src/       # Source code
│       │   ├── api/   # API client and services
│       │   ├── components/ # React components
│       │   ├── context/    # React context providers
│       │   ├── hooks/      # Custom React hooks
│       │   ├── pages/      # Page components
│       │   └── utils/      # Utility functions
│       └── tests/      # Frontend tests
├── docs/               # Documentation
│   ├── architecture/   # Architecture documentation
│   ├── api/           # API documentation
│   └── guides/        # User and developer guides
├── infrastructure/     # Infrastructure as Code
│   ├── terraform/      # Terraform configurations
│   ├── docker/         # Docker configurations
│   └── monitoring/     # Monitoring configurations
└── .github/            # GitHub configuration files
```

## Documentation

For more detailed documentation, please refer to:
- [Architecture Overview](docs/architecture/overview.md)
- [Backend Documentation](docs/architecture/backend.md)
- [Frontend Documentation](docs/architecture/frontend.md)
- [API Documentation](docs/api/auth.md)
- [Development Setup Guide](docs/guides/development_setup.md)
- [Deployment Guide](docs/guides/deployment.md)

## Contributing

We welcome contributions to the Interaction Management System! Here's how you can contribute:

1. **Code of Conduct**: Please respect our community guidelines focused on making this project open and welcoming to all contributors.

2. **Reporting Issues**: Use the GitHub issue tracker to report bugs or suggest enhancements.

3. **Development Process**:
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add some amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request

4. **Pull Request Guidelines**:
   - Include a clear description of the changes
   - Update documentation as needed
   - Adhere to the existing code style
   - Ensure all tests pass
   - Add tests for new features

5. **Code Review**: All submissions require review before being merged.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.