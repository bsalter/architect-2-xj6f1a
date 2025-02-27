/// <reference types="cypress" />

import { Interaction, InteractionSearchFilters as FilterCriteria } from '../../src/types/interactions';

/**
 * Custom Cypress commands for end-to-end testing of the Interaction Management System.
 * These commands extend Cypress with application-specific functionality for testing
 * authentication, site context management, interaction operations, and finder functionality.
 * 
 * @version 1.0.0
 */

/**
 * Custom command to log in a user with the given username and password
 */
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for either site selector or finder component to confirm successful login
  cy.get('body').then($body => {
    if ($body.find('[data-testid="site-selector"]').length > 0) {
      // User has multiple sites
      cy.get('[data-testid="site-selector"]').should('be.visible');
    } else {
      // User has only one site, automatically redirected to finder
      cy.get('[data-testid="finder-table"]').should('exist');
    }
  });
});

/**
 * Custom command to select a site from the site selector dropdown
 */
Cypress.Commands.add('selectSite', (siteName: string) => {
  cy.get('[data-testid="site-selector"]').click();
  cy.contains(siteName).click();
  
  // The switch site button might only appear in certain UIs
  cy.get('body').then($body => {
    if ($body.find('[data-testid="switch-site-button"]').length > 0) {
      cy.get('[data-testid="switch-site-button"]').click();
    }
  });
  
  // Verify site context changed
  cy.get('[data-testid="current-site"]').should('contain', siteName);
});

/**
 * Custom command to create a new interaction with the provided details
 */
Cypress.Commands.add('createInteraction', (interactionData: Partial<Interaction>) => {
  cy.visit('/finder');
  cy.get('[data-testid="new-interaction-button"]').click();
  
  // Fill in the form fields
  if (interactionData.title) {
    cy.get('[data-testid="title-input"]').type(interactionData.title);
  }
  
  if (interactionData.type) {
    cy.get('[data-testid="type-select"]').select(interactionData.type.toString());
  }
  
  if (interactionData.lead) {
    cy.get('[data-testid="lead-input"]').type(interactionData.lead);
  }
  
  if (interactionData.startDateTime) {
    // Handle date and time fields based on application's implementation
    const startDate = new Date(interactionData.startDateTime);
    const formattedDate = startDate.toISOString().split('T')[0];
    const formattedTime = startDate.toTimeString().split(' ')[0].substring(0, 5);
    
    cy.get('[data-testid="start-date-input"]').type(formattedDate);
    cy.get('[data-testid="start-time-input"]').type(formattedTime);
  }
  
  if (interactionData.timezone) {
    cy.get('[data-testid="timezone-select"]').select(interactionData.timezone);
  }
  
  if (interactionData.endDateTime) {
    const endDate = new Date(interactionData.endDateTime);
    const formattedDate = endDate.toISOString().split('T')[0];
    const formattedTime = endDate.toTimeString().split(' ')[0].substring(0, 5);
    
    cy.get('[data-testid="end-date-input"]').type(formattedDate);
    cy.get('[data-testid="end-time-input"]').type(formattedTime);
  }
  
  if (interactionData.location) {
    cy.get('[data-testid="location-input"]').type(interactionData.location);
  }
  
  if (interactionData.description) {
    cy.get('[data-testid="description-input"]').type(interactionData.description);
  }
  
  if (interactionData.notes) {
    cy.get('[data-testid="notes-input"]').type(interactionData.notes);
  }
  
  // Save the interaction
  cy.get('[data-testid="save-button"]').click();
  
  // Verify successful creation
  cy.get('[data-testid="success-message"]').should('be.visible');
  cy.get('[data-testid="finder-table"]').should('exist');
});

/**
 * Custom command to search for interactions using the search bar
 */
Cypress.Commands.add('searchInteractions', (searchTerm: string) => {
  cy.visit('/finder');
  cy.get('[data-testid="search-input"]').clear().type(searchTerm);
  
  // Allow for both button click and Enter key search implementations
  cy.get('body').then($body => {
    if ($body.find('[data-testid="search-button"]').length > 0) {
      cy.get('[data-testid="search-button"]').click();
    } else {
      cy.get('[data-testid="search-input"]').type('{enter}');
    }
  });
  
  // Wait for search results to load
  cy.get('body').then($body => {
    if ($body.find('[data-testid="loading-indicator"]').length > 0) {
      cy.get('[data-testid="loading-indicator"]').should('not.exist');
    }
  });
});

/**
 * Custom command to apply advanced filters to the interaction list
 */
Cypress.Commands.add('applyAdvancedFilters', (filterCriteria: FilterCriteria) => {
  cy.visit('/finder');
  cy.get('[data-testid="advanced-filters-button"]').click();
  
  // Apply filters based on the criteria
  if (filterCriteria.title) {
    cy.get('[data-testid="filter-title"]').type(filterCriteria.title);
  }
  
  if (filterCriteria.type) {
    cy.get('[data-testid="filter-type"]').select(filterCriteria.type.toString());
  }
  
  if (filterCriteria.lead) {
    cy.get('[data-testid="filter-lead"]').type(filterCriteria.lead);
  }
  
  if (filterCriteria.startDate) {
    cy.get('[data-testid="filter-start-date"]').type(filterCriteria.startDate);
  }
  
  if (filterCriteria.endDate) {
    cy.get('[data-testid="filter-end-date"]').type(filterCriteria.endDate);
  }
  
  if (filterCriteria.location) {
    cy.get('[data-testid="filter-location"]').type(filterCriteria.location);
  }
  
  // Apply the filters
  cy.get('[data-testid="apply-filters-button"]').click();
  
  // Wait for filtered results to load
  cy.get('body').then($body => {
    if ($body.find('[data-testid="loading-indicator"]').length > 0) {
      cy.get('[data-testid="loading-indicator"]').should('not.exist');
    }
  });
});

/**
 * Custom command to edit an existing interaction by title
 */
Cypress.Commands.add('editInteraction', (interactionTitle: string, updatedData: Partial<Interaction>) => {
  cy.visit('/finder');
  
  // Search for the interaction if needed
  cy.get('[data-testid="search-input"]').clear().type(interactionTitle);
  cy.get('[data-testid="search-button"]').click({force: true});
  
  // Find the interaction in the table and click edit
  cy.contains('td', interactionTitle)
    .parents('tr')
    .find('[data-testid="edit-button"]')
    .click();
  
  // Update fields based on the provided data
  if (updatedData.title) {
    cy.get('[data-testid="title-input"]').clear().type(updatedData.title);
  }
  
  if (updatedData.type) {
    cy.get('[data-testid="type-select"]').select(updatedData.type.toString());
  }
  
  if (updatedData.lead) {
    cy.get('[data-testid="lead-input"]').clear().type(updatedData.lead);
  }
  
  if (updatedData.startDateTime) {
    const startDate = new Date(updatedData.startDateTime);
    const formattedDate = startDate.toISOString().split('T')[0];
    const formattedTime = startDate.toTimeString().split(' ')[0].substring(0, 5);
    
    cy.get('[data-testid="start-date-input"]').clear().type(formattedDate);
    cy.get('[data-testid="start-time-input"]').clear().type(formattedTime);
  }
  
  if (updatedData.timezone) {
    cy.get('[data-testid="timezone-select"]').select(updatedData.timezone);
  }
  
  if (updatedData.endDateTime) {
    const endDate = new Date(updatedData.endDateTime);
    const formattedDate = endDate.toISOString().split('T')[0];
    const formattedTime = endDate.toTimeString().split(' ')[0].substring(0, 5);
    
    cy.get('[data-testid="end-date-input"]').clear().type(formattedDate);
    cy.get('[data-testid="end-time-input"]').clear().type(formattedTime);
  }
  
  if (updatedData.location) {
    cy.get('[data-testid="location-input"]').clear().type(updatedData.location);
  }
  
  if (updatedData.description) {
    cy.get('[data-testid="description-input"]').clear().type(updatedData.description);
  }
  
  if (updatedData.notes) {
    cy.get('[data-testid="notes-input"]').clear().type(updatedData.notes);
  }
  
  // Save the changes
  cy.get('[data-testid="save-button"]').click();
  
  // Verify successful update
  cy.get('[data-testid="success-message"]').should('be.visible');
  cy.get('[data-testid="finder-table"]').should('exist');
});

/**
 * Custom command to delete an interaction by title
 */
Cypress.Commands.add('deleteInteraction', (interactionTitle: string) => {
  cy.visit('/finder');
  
  // Search for the interaction if needed
  cy.get('[data-testid="search-input"]').clear().type(interactionTitle);
  cy.get('[data-testid="search-button"]').click({force: true});
  
  // Find the interaction in the table and click edit
  cy.contains('td', interactionTitle)
    .parents('tr')
    .find('[data-testid="edit-button"]')
    .click();
  
  // Click delete button
  cy.get('[data-testid="delete-button"]').click();
  
  // Confirm deletion
  cy.get('[data-testid="confirm-delete-button"]').click();
  
  // Verify successful deletion
  cy.get('[data-testid="success-message"]').should('be.visible');
  cy.get('[data-testid="finder-table"]').should('exist');
});

/**
 * Custom command to log out the current user
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  
  // Verify redirect to login page
  cy.get('[data-testid="login-form"]').should('exist');
});

// Extend the Cypress namespace with custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user with the given username and password
       * @param username - The username to log in with
       * @param password - The password to log in with
       * @example cy.login('testuser', 'password123')
       */
      login(username: string, password: string): void;
      
      /**
       * Custom command to select a site from the site selector dropdown
       * @param siteName - The name of the site to select
       * @example cy.selectSite('Marketing')
       */
      selectSite(siteName: string): void;
      
      /**
       * Custom command to create a new interaction with the provided details
       * @param interactionData - The interaction data to create
       * @example cy.createInteraction({ title: 'Test Meeting', type: InteractionType.MEETING, lead: 'John Doe' })
       */
      createInteraction(interactionData: Partial<Interaction>): void;
      
      /**
       * Custom command to search for interactions using the search bar
       * @param searchTerm - The search term to use
       * @example cy.searchInteractions('Meeting')
       */
      searchInteractions(searchTerm: string): void;
      
      /**
       * Custom command to apply advanced filters to the interaction list
       * @param filterCriteria - The filter criteria to apply
       * @example cy.applyAdvancedFilters({ title: 'Meeting', type: InteractionType.MEETING })
       */
      applyAdvancedFilters(filterCriteria: FilterCriteria): void;
      
      /**
       * Custom command to edit an existing interaction by title
       * @param interactionTitle - The title of the interaction to edit
       * @param updatedData - The updated data for the interaction
       * @example cy.editInteraction('Test Meeting', { title: 'Updated Meeting' })
       */
      editInteraction(interactionTitle: string, updatedData: Partial<Interaction>): void;
      
      /**
       * Custom command to delete an interaction by title
       * @param interactionTitle - The title of the interaction to delete
       * @example cy.deleteInteraction('Test Meeting')
       */
      deleteInteraction(interactionTitle: string): void;
      
      /**
       * Custom command to log out the current user
       * @example cy.logout()
       */
      logout(): void;
    }
  }
}

// Export empty object to make this file a module
export {};