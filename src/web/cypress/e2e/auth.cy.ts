/// <reference types="cypress" />

import '../support/e2e';

/**
 * End-to-end tests for authentication functionality in the Interaction Management System.
 * These tests verify the complete authentication flow including login, logout, site selection,
 * and authentication error scenarios as specified in the system requirements.
 */
describe('Authentication Tests', () => {
  beforeEach(() => {
    // Clear cookies and local storage to ensure a clean state for each test
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Set up intercepts for authentication API calls
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.intercept('GET', '/api/auth/sites').as('getSites');
    cy.intercept('POST', '/api/auth/site').as('setSite');
    cy.intercept('GET', '/api/interactions*').as('getInteractions');
  });

  it('should login successfully with valid credentials', () => {
    // Stub the login API response for successful authentication
    cy.fixture('users/single-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginSuccess');
      
      // Stub the interactions API for subsequent page load
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            interactions: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 0,
                totalRecords: 0
              }
            }
          }
        }
      }).as('getInteractions');
      
      // Visit the login page
      cy.visit('/login');
      
      // Enter valid credentials
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for API response
      cy.wait('@loginSuccess');
      
      // Verify redirection to finder page (for single-site user)
      cy.url().should('include', '/finder');
      cy.wait('@getInteractions');
      
      // Verify authentication token is stored
      cy.window().then((window) => {
        const token = window.localStorage.getItem('auth_token');
        expect(token).to.exist;
      });
      
      // Verify finder table is loaded
      cy.get('[data-testid="finder-table"]').should('exist');
    });
  });

  it('should display error message with invalid credentials', () => {
    // Stub the login API response for failed authentication
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        status: 'error',
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid username or password'
        }
      }
    }).as('loginFailure');
    
    // Visit the login page
    cy.visit('/login');
    
    // Enter invalid credentials
    cy.get('[data-testid="username-input"]').type('wronguser');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for API response
    cy.wait('@loginFailure');
    
    // Verify error message is displayed
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid username or password');
    
    // Verify we remain on the login page
    cy.url().should('include', '/login');
    
    // Verify login form is still present
    cy.get('[data-testid="login-form"]').should('exist');
  });

  it('should redirect to site selection for multi-site users', () => {
    // Stub the login API response for successful authentication with multiple sites
    cy.fixture('users/multi-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginMultiSite');
      
      // Visit the login page
      cy.visit('/login');
      
      // Enter credentials for multi-site user
      cy.get('[data-testid="username-input"]').type('multiuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for API response
      cy.wait('@loginMultiSite');
      
      // Verify site selector is displayed
      cy.get('[data-testid="site-selector"]').should('be.visible');
      
      // Verify all user's sites are shown in the dropdown
      user.sites.forEach(site => {
        cy.get('[data-testid="site-selector"]').should('contain', site.name);
      });
    });
  });

  it('should redirect to finder for single-site users', () => {
    // Stub the login API response for successful authentication with a single site
    cy.fixture('users/single-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginSingleSite');
      
      // Stub the interactions API for the finder page
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            interactions: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 0,
                totalRecords: 0
              }
            }
          }
        }
      }).as('getInteractions');
      
      // Visit the login page
      cy.visit('/login');
      
      // Enter credentials for single-site user
      cy.get('[data-testid="username-input"]').type('singleuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for API response
      cy.wait('@loginSingleSite');
      
      // Verify direct redirection to finder page
      cy.url().should('include', '/finder');
      cy.wait('@getInteractions');
      
      // Verify site context is set correctly in UI
      cy.get('[data-testid="current-site"]').should('contain', user.sites[0].name);
    });
  });

  it('should allow selecting a site and setting as default', () => {
    // Stub the login API response for successful authentication with multiple sites
    cy.fixture('users/multi-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginMultiSite');
      
      // Stub the site context API
      const targetSite = user.sites[1]; // Second site in the list
      cy.intercept('POST', '/api/auth/site', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            success: true,
            currentSite: targetSite
          }
        }
      }).as('setSiteContext');
      
      // Stub the interactions API for the finder page
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            interactions: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 0,
                totalRecords: 0
              }
            }
          }
        }
      }).as('getInteractions');
      
      // Visit the login page and login
      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('multiuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginMultiSite');
      
      // Select the second site in the dropdown
      cy.get('[data-testid="site-selector"]').select(targetSite.id.toString());
      
      // Set as default site
      cy.get('[data-testid="default-site-checkbox"]').check();
      
      // Click continue
      cy.get('[data-testid="continue-button"]').click();
      
      // Wait for API call to set site context
      cy.wait('@setSiteContext');
      cy.wait('@getInteractions');
      
      // Verify redirection to finder
      cy.url().should('include', '/finder');
      
      // Verify site context is set correctly
      cy.get('[data-testid="current-site"]').should('contain', targetSite.name);
      
      // Verify default site preference is stored
      cy.window().then((window) => {
        const defaultSite = window.localStorage.getItem('default_site');
        expect(defaultSite).to.eq(targetSite.id.toString());
      });
    });
  });

  it('should logout successfully', () => {
    // Stub the login API response for successful authentication
    cy.fixture('users/single-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginRequest');
      
      // Stub the interactions API for the finder page
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            interactions: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 0,
                totalRecords: 0
              }
            }
          }
        }
      }).as('getInteractions');
      
      // Stub the logout API response
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            success: true
          }
        }
      }).as('logoutRequest');
      
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginRequest');
      cy.wait('@getInteractions');
      
      // Verify we're logged in
      cy.url().should('include', '/finder');
      
      // Now perform logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Wait for logout API call
      cy.wait('@logoutRequest');
      
      // Verify redirection to login
      cy.url().should('include', '/login');
      
      // Verify login form is displayed
      cy.get('[data-testid="login-form"]').should('exist');
      
      // Verify protected routes are inaccessible
      cy.visit('/finder');
      cy.url().should('include', '/login'); // Should redirect to login
    });
  });

  it('should persist authentication across page reloads', () => {
    // Stub the login API response for successful authentication
    cy.fixture('users/single-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginRequest');
      
      // Stub the interactions API for the finder page
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            interactions: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 0,
                totalRecords: 0
              }
            }
          }
        }
      }).as('getInteractions');
      
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginRequest');
      cy.wait('@getInteractions');
      
      // Verify we're on the finder page
      cy.url().should('include', '/finder');
      
      // Reload the page
      cy.reload();
      
      // Wait for the interactions API call triggered by reload
      cy.wait('@getInteractions');
      
      // Verify we're still logged in and on finder page
      cy.url().should('include', '/finder');
      
      // Verify site context is maintained
      cy.get('[data-testid="current-site"]').should('contain', user.sites[0].name);
      
      // Verify finder table is still displayed
      cy.get('[data-testid="finder-table"]').should('exist');
    });
  });

  it('should handle session timeout correctly', () => {
    // Stub the login API response for successful authentication
    cy.fixture('users/single-site-user.json').then((user) => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            token: 'valid-token-for-testing',
            user
          }
        }
      }).as('loginRequest');
      
      // Initially successful interactions API
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            interactions: [],
            meta: {
              pagination: {
                page: 1,
                pageSize: 25,
                totalPages: 0,
                totalRecords: 0
              }
            }
          }
        }
      }).as('getInteractions');
      
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="username-input"]').type('testuser');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      cy.wait('@loginRequest');
      cy.wait('@getInteractions');
      
      // Verify we're logged in
      cy.url().should('include', '/finder');
      
      // Now simulate token expiration by returning 401 for API calls
      cy.intercept('GET', '/api/interactions*', {
        statusCode: 401,
        body: {
          status: 'error',
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Session expired. Please log in again.'
          }
        }
      }).as('expiredSession');
      
      // Trigger an API call that would use the expired token
      cy.get('[data-testid="search-input"]').type('test{enter}');
      cy.wait('@expiredSession');
      
      // Verify redirection to login page
      cy.url().should('include', '/login');
      
      // Verify error message about session expiration
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="error-message"]').should('contain', 'Session expired');
    });
  });
});