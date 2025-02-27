/**
 * Global Jest setup file for configuring the test environment.
 * Sets up MSW for API mocking, extends Jest with DOM testing utilities,
 * and provides browser API mocks for tests.
 * 
 * @version 1.0.0
 */

// Import MSW server for API mocking
import server from './mocks/server'; // v1.0.0

// Import jest-dom for extended DOM testing assertions
import '@testing-library/jest-dom'; // v5.16.5

// Start MSW server before all tests
beforeAll(() => { 
  server.listen({ onUnhandledRequest: 'error' }) 
});

// Reset handlers after each test for clean state
afterEach(() => { 
  server.resetHandlers() 
});

// Close MSW server after all tests
afterAll(() => { 
  server.close() 
});

// Mock window.matchMedia for tests, as it's not available in JSDOM
Object.defineProperty(window, 'matchMedia', { 
  value: jest.fn().mockImplementation(query => ({ 
    matches: false, 
    media: query, 
    onchange: null, 
    addListener: jest.fn(), 
    removeListener: jest.fn() 
  }))
});