/**
 * Configures and exports a Mock Service Worker (MSW) server instance for testing.
 * The server intercepts API requests made during tests and provides mock responses,
 * allowing frontend tests to run without an actual backend.
 * 
 * @version 1.0.0
 */

import { setupServer } from 'msw/node'; // v1.2.2
import { handlers } from './handlers';

// Create the test server with the imported handlers
export const server = setupServer(...handlers);