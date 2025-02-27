// Import custom commands for the Interaction Management System
import './commands';

/**
 * Configure Cypress global behavior for the Interaction Management System E2E tests
 * 
 * This file is automatically loaded before each test, setting up the global
 * test environment and custom command availability for testing critical user flows:
 * - Authentication and site context management
 * - Interaction creation, editing, and deletion
 * - Finder search and filtering functionality
 */

// Prevents Cypress from failing tests on uncaught exceptions from the application
// This is helpful for handling non-critical errors that don't affect test flows
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error for debugging purposes
  console.error('Uncaught exception in application:', err.message);
  
  // Return false to prevent Cypress from failing the test
  return false;
});

// Preserve authentication and site context cookies between tests
// This improves test performance by preventing unnecessary re-authentication
Cypress.Cookies.defaults({
  preserve: [
    // Authentication token cookie
    'auth_token',
    // Site context cookie
    'site_context',
    // Session identification
    'session_id',
    // JWT token if stored in cookies
    'jwt',
  ],
});