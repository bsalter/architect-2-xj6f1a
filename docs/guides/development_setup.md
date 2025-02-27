# Development Environment Setup Guide

This guide provides comprehensive instructions for setting up the development environment for the Interaction Management System project. It covers both frontend and backend components, database configuration, local testing, and Docker-based development.

## Prerequisites

Before starting the setup process, ensure you have the following tools installed on your system:

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| [Git](https://git-scm.com/downloads) | Latest | Version control |
| [Python](https://www.python.org/downloads/) | 3.11.x | Backend development |
| [Node.js](https://nodejs.org/) | 18.x | Frontend development |
| [PostgreSQL](https://www.postgresql.org/download/) | 15.3 | Database (optional if using Docker) |
| [Redis](https://redis.io/download) | 7.0.12 | Caching (optional if using Docker) |
| [Docker](https://www.docker.com/get-started) | 24.x | Containerized development |
| [Docker Compose](https://docs.docker.com/compose/install/) | Latest | Multi-container orchestration |

### Recommended IDE Setup

We recommend [Visual Studio Code](https://code.visualstudio.com/) with the following extensions:

- **Python**: Python extension for VSCode
- **Pylance**: Python language server
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **GitLens**: Git integration
- **Docker**: Docker integration
- **SQLTools**: Database management
- **Tailwind CSS IntelliSense**: CSS class autocompletion

### VSCode Workspace Settings

Create a `.vscode/settings.json` file in your project root with these recommended settings:

```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "typescript", "typescriptreact"],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

## Backend Setup

Follow these steps to set up the backend development environment:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd interaction-management-system
```

### 2. Create and Activate Python Virtual Environment

#### On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

#### On Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install Backend Dependencies

```bash
cd src/backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `src/backend` directory by copying the provided example:

```bash
cp .env.example .env
```

Edit the `.env` file to configure your local environment settings. At minimum, update these variables:

```
SECRET_KEY=<generate-a-secure-random-key>
DATABASE_URI=postgresql://postgres:password@localhost:5432/interaction_db
```

You can generate a secure key using Python:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Initialize the Database

First, ensure your PostgreSQL database is running and create the database:

```bash
# Execute these commands in your PostgreSQL client or terminal
CREATE DATABASE interaction_db;
```

Then run the migrations:

```bash
flask db upgrade
```

### 6. Seed the Database with Test Data

```bash
flask seed-db
```

### 7. Run the Flask Development Server

```bash
flask run
```

The backend API will be available at http://localhost:5000.

## Frontend Setup

Follow these steps to set up the frontend development environment:

### 1. Navigate to the Frontend Directory

```bash
cd src/web
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `src/web` directory by copying the provided example:

```bash
cp .env.example .env
```

At minimum, ensure the API URL points to your local backend:

```
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Development Server

```bash
npm run dev
```

The frontend development server will start and be available at http://localhost:5173.

## Database Setup

If you're not using Docker, follow these steps to set up PostgreSQL directly:

### 1. Install PostgreSQL

Follow the installation instructions for your operating system from the [PostgreSQL website](https://www.postgresql.org/download/).

### 2. Create Database and User

Connect to PostgreSQL and create the database and user:

```sql
CREATE DATABASE interaction_db;
CREATE USER interaction_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE interaction_db TO interaction_user;
```

### 3. Update Environment Configuration

Update your backend `.env` file with the database connection information:

```
DATABASE_URI=postgresql://interaction_user:your_password@localhost:5432/interaction_db
```

### 4. Run Database Migrations

Navigate to the backend directory and run:

```bash
flask db upgrade
```

### 5. Create the Test Database (for testing)

```sql
CREATE DATABASE test_db;
GRANT ALL PRIVILEGES ON DATABASE test_db TO interaction_user;
```

## Docker Setup

For a containerized development environment, follow these steps:

### 1. Install Docker and Docker Compose

Follow the installation instructions for your operating system:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Configure Environment Files

Create the necessary `.env` files for both backend and frontend by copying the example files:

```bash
cp src/backend/.env.example src/backend/.env
cp src/web/.env.example src/web/.env
```

Update the backend `.env` file to use the Docker services:

```
DATABASE_URI=postgresql://postgres:postgres@db:5432/interaction_management
REDIS_URL=redis://redis:6379/0
```

Update the frontend `.env` file to point to the Docker backend service:

```
VITE_API_URL=http://localhost:5000/api
```

### 3. Build and Start the Docker Services

Navigate to the project root and run:

```bash
cd src/backend
docker-compose build
docker-compose up
```

This will start the following services:
- Backend API: http://localhost:5000
- PostgreSQL database: localhost:5432
- Redis cache: localhost:6379
- pgAdmin web interface: http://localhost:8080 (login with admin@example.com / admin)

### 4. Access the Application

- Backend API: http://localhost:5000
- Frontend (need to be started separately): http://localhost:5173

### 5. Stop the Docker Services

To stop the running containers:

```bash
docker-compose down
```

To remove all data volumes (this will delete your database data):

```bash
docker-compose down -v
```

## Environment Configuration

Both the backend and frontend use environment variables for configuration. Here's a detailed explanation of key variables:

### Backend Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| FLASK_ENV | Environment type | development |
| SECRET_KEY | Flask secret key | random-secure-string |
| DATABASE_URI | PostgreSQL connection string | postgresql://user:pass@host:port/db |
| JWT_SECRET_KEY | JWT token signing key | random-secure-string |
| REDIS_URL | Redis connection string | redis://localhost:6379/0 |
| CORS_ALLOWED_ORIGINS | CORS settings | http://localhost:5173,http://localhost:3000 |
| SITE_COOKIE_NAME | Cookie name for site selection | site_id |
| DEFAULT_SITE_ID | Default site ID | 1 |

### Frontend Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| VITE_API_URL | Backend API base URL | http://localhost:5000/api |
| VITE_AUTH0_DOMAIN | Auth0 domain (if used) | dev-example.auth0.com |
| VITE_AUTH0_CLIENT_ID | Auth0 client ID (if used) | your_client_id_here |
| VITE_ENV | Environment name | development |
| VITE_APP_NAME | Application name | Interaction Management System |
| VITE_DEFAULT_TIMEZONE | Default timezone | America/New_York |

## Running the Application

### Running Backend and Frontend Separately

#### Backend:

```bash
cd src/backend
source venv/bin/activate  # If not already activated
flask run
```

#### Frontend:

```bash
cd src/web
npm run dev
```

### Running Everything with Docker

```bash
cd src/backend
docker-compose up
cd ../web
npm run dev
```

### Production Build

To create a production build of the frontend:

```bash
cd src/web
npm run build
```

The built files will be in the `dist` directory, which can be served by any static file server.

## Testing

### Setting Up the Testing Environment

#### Backend Testing Setup

1. Configure the test database in your `.env` file:

```
TEST_DATABASE_URI=postgresql://postgres:password@localhost:5432/test_db
```

2. Create the test database if not already created:

```sql
CREATE DATABASE test_db;
```

#### Frontend Testing Setup

The Jest testing environment is already configured in `package.json`.

### Running Tests

#### Backend Tests

```bash
cd src/backend
pytest
```

To run with coverage:

```bash
pytest --cov=app
```

#### Frontend Tests

```bash
cd src/web
npm test
```

To run with coverage:

```bash
npm run test:coverage
```

#### End-to-End Tests

```bash
cd src/web
npm run test:e2e
```

To open the Cypress test runner:

```bash
npm run test:e2e:open
```

### Test Database Seeding

To seed the test database with sample data:

```bash
cd src/backend
FLASK_ENV=testing flask seed-db
```

## Troubleshooting

### Common Backend Issues

#### Database Connection Issues

**Problem**: Unable to connect to PostgreSQL database.

**Solution**:
- Verify PostgreSQL is running with `pg_isready` or `ps aux | grep postgres`
- Check the connection parameters in your `.env` file
- Ensure the database and user exist
- Try connecting with a PostgreSQL client like `psql`

#### Migration Issues

**Problem**: Flask db upgrade fails.

**Solution**:
- Check for database connection issues
- Reset migrations with `flask db stamp head` then try again
- If error persists, delete the migrations folder and run `flask db init`, `flask db migrate`, and `flask db upgrade`

#### Redis Connection Issues

**Problem**: Unable to connect to Redis.

**Solution**:
- Verify Redis is running with `redis-cli ping`
- Check the REDIS_URL in your `.env` file
- If using Docker, ensure the Redis container is running

### Common Frontend Issues

#### Node Module Issues

**Problem**: Errors related to missing modules or incompatible versions.

**Solution**:
- Delete `node_modules` directory and run `npm install` again
- Clear NPM cache with `npm cache clean --force`
- Ensure you're using Node.js 18.x with `node --version`

#### API Connection Issues

**Problem**: Frontend cannot connect to backend API.

**Solution**:
- Verify the API is running and accessible
- Check VITE_API_URL in your frontend `.env` file
- Check browser console for CORS errors
- Ensure CORS_ALLOWED_ORIGINS in backend includes your frontend URL

#### Build Issues

**Problem**: Vite build fails.

**Solution**:
- Check TypeScript errors with `npm run typecheck`
- Fix ESLint issues with `npm run lint`
- Ensure all dependencies are installed correctly

### Docker Issues

#### Container Start Failures

**Problem**: Docker containers fail to start.

**Solution**:
- Check logs with `docker-compose logs -f`
- Ensure ports are not already in use
- Try rebuilding with `docker-compose build --no-cache`
- Verify Docker and Docker Compose are up to date

#### Volume Permission Issues

**Problem**: Permission denied errors in Docker logs.

**Solution**:
- Fix permissions on host directories
- Use Docker volumes instead of bind mounts
- Run containers with appropriate user permissions

## Advanced Configuration

### Custom Authentication Setup

If you're using Auth0 for authentication, update these environment variables:

**Backend**:
```
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_API_AUDIENCE=your-auth0-api-audience
```

**Frontend**:
```
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-audience
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback
```

### Setting Up AWS Services

For AWS S3 integration, configure these variables in backend `.env`:

```
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
```

### Email Configuration

For SendGrid email integration:

```
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@example.com
```

## Contributing Guidelines

Before submitting code, ensure:

1. All tests pass with `pytest` and `npm test`
2. Backend code is formatted with Black: `black src/backend`
3. Frontend code is formatted with Prettier: `npm run format`
4. Lint checks pass with `flake8 src/backend` and `npm run lint`
5. TypeScript type checking passes with `npm run typecheck`

## Support

If you encounter issues not covered in this guide, please:

1. Check the project's issue tracker on GitHub
2. Contact the development team via Slack
3. Email support at project-support@example.com