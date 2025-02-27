# Interaction Management System - Frontend

A React-based frontend application for managing and viewing Interaction records through a searchable table interface ('Finder') and a dedicated add/edit form.

## Features

- Secure authentication with site-scoped access control
- Interactive Finder interface with advanced search and filtering
- Comprehensive Interaction form for creating and editing records
- Responsive design for various screen sizes
- Type-safe development with TypeScript
- Comprehensive test coverage with Jest and Cypress

## Tech Stack

- React 18.2.0
- TypeScript 5.1.6
- React Router 6.14.2 for navigation
- React Query 4.29.5 for data fetching
- React Hook Form 7.45.1 for form handling
- TailwindCSS 3.3.3 for styling
- date-fns 2.30.0 for date manipulation
- Vite 4.4.6 for build tooling
- Jest and Testing Library for unit tests
- Cypress for end-to-end testing

## Project Structure

```
/src
  /api          # API client code and endpoint-specific services
  /assets       # Static assets (images, icons, global styles)
  /components   # React components organized by feature
    /ui         # Reusable UI components
    /shared     # Shared components used across features
    /layout     # Layout components (header, sidebar, etc.)
    /auth       # Authentication-related components
    /finder     # Components for the Finder interface
    /interaction # Components for the Interaction form
  /context      # React Context providers
  /hooks        # Custom React hooks
  /pages        # Page components mapped to routes
  /routes       # Routing configuration
  /types        # TypeScript type definitions
  /utils        # Utility functions and constants
/tests          # Test files
  /mocks        # Test mocks and fixtures
  /components   # Component tests
  /hooks        # Hook tests
  /context      # Context tests
/cypress        # End-to-end tests
```

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation
1. Clone the repository
2. Navigate to the web directory: `cd src/web`
3. Copy the environment file: `cp .env.example .env`
4. Install dependencies: `npm install`

### Development
Start the development server:
```
npm run dev
```
The application will be available at http://localhost:3000 and will automatically proxy API requests to http://localhost:5000.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run cypress:open` - Open Cypress test runner
- `npm run cypress:run` - Run Cypress tests headlessly
- `npm run e2e` - Run end-to-end tests with test server
- `npm run type-check` - Check TypeScript types

## Key Components

### Authentication
- `src/components/auth/LoginForm.tsx` - User login form
- `src/context/AuthContext.tsx` - Authentication state management

### Finder Interface
- `src/components/finder/InteractionFinder.tsx` - Main container for the Finder
- `src/components/finder/InteractionTable.tsx` - Tabular display of interactions
- `src/components/finder/SearchBar.tsx` - Search input for filtering interactions
- `src/components/finder/AdvancedFilters.tsx` - Field-specific filtering

### Interaction Form
- `src/components/interaction/InteractionForm.tsx` - Form for creating/editing interactions
- `src/components/interaction/DateTimeSelector.tsx` - Date/time input with timezone support

### Site Context
- `src/context/SiteContext.tsx` - Site-scoping context provider
- `src/components/layout/SiteSelector.tsx` - UI for selecting active site

## Testing

### Unit and Integration Tests
Run Jest tests:
```
npm run test
```

### End-to-End Tests
Run Cypress tests:
```
npm run e2e
```

Test files are located in:
- Unit tests: `/tests`
- E2E tests: `/cypress/e2e`

## Building for Production

```
npm run build
```

The build artifacts will be stored in the `dist/` directory and can be served using any static file server.

## Development Guidelines

- Follow the established project structure when adding new features
- Maintain type safety with proper TypeScript types
- Use the existing UI components from the `components/ui` directory
- Write tests for all new features
- Ensure all code passes linting and type checking before committing
- Use React Query for data fetching and state management
- Follow the site-scoping pattern for all data operations
- Use context providers for cross-cutting concerns

## Documentation

For more detailed documentation, refer to:
- `docs/architecture/frontend.md` - Frontend architecture details
- `docs/guides/development_setup.md` - Detailed setup instructions
- `docs/project/requirements.md` - Project requirements