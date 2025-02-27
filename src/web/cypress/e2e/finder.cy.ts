/// <reference types="cypress" />

import '../support/e2e';
import interactions from '../fixtures/interactions.json';
import users from '../fixtures/users.json';

describe('Interaction Finder', () => {
  beforeEach(() => {
    // Login with admin user who has access to all sites
    cy.login(users[0].username, users[0].password);
    
    // Intercept API requests for interactions
    cy.intercept('GET', '/api/interactions*').as('getInteractions');
    
    // Visit the finder page
    cy.visit('/finder');
    
    // Wait for the page to load
    cy.wait('@getInteractions');
    
    // Verify finder components are visible
    cy.get('[data-testid="finder-table"]').should('be.visible');
    cy.get('[data-testid="search-input"]').should('be.visible');
  });

  it('should display the finder table with interactions', () => {
    // Mock API response with interactions
    cy.intercept('GET', '/api/interactions*', {
      status: 'success',
      data: interactions.slice(0, 5),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: 5
        }
      }
    }).as('getInteractions');
    
    // Reload the page to trigger the intercepted request
    cy.visit('/finder');
    cy.wait('@getInteractions');
    
    // Verify table headers
    cy.get('[data-testid="finder-table"] th').should('contain', 'Title');
    cy.get('[data-testid="finder-table"] th').should('contain', 'Type');
    cy.get('[data-testid="finder-table"] th').should('contain', 'Lead');
    cy.get('[data-testid="finder-table"] th').should('contain', 'Date/Time');
    cy.get('[data-testid="finder-table"] th').should('contain', 'Location');
    
    // Verify interactions are displayed
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', 5);
    
    // Verify first interaction data
    cy.get('[data-testid="finder-table"] tbody tr').first().within(() => {
      cy.get('td').eq(0).should('contain', interactions[0].title);
      cy.get('td').eq(1).should('contain', interactions[0].type);
      cy.get('td').eq(2).should('contain', interactions[0].lead);
    });
    
    // Verify pagination controls
    cy.get('[data-testid="pagination-controls"]').should('exist');
  });

  it('should allow searching for interactions', () => {
    const searchTerm = 'Client';
    const filteredInteractions = interactions.filter(i => 
      i.title.includes(searchTerm) || 
      i.description.includes(searchTerm) || 
      i.notes.includes(searchTerm)
    );
    
    // Mock search results
    cy.intercept('GET', `/api/interactions*search=${searchTerm}*`, {
      status: 'success',
      data: filteredInteractions,
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: filteredInteractions.length
        }
      }
    }).as('searchInteractions');
    
    // Perform search
    cy.get('[data-testid="search-input"]').type(searchTerm);
    cy.get('[data-testid="search-button"]').click();
    
    // Wait for search results
    cy.wait('@searchInteractions');
    
    // Verify search request was made with the correct parameter
    cy.get('@searchInteractions.all').should('have.length.at.least', 1);
    
    // Verify search results
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', filteredInteractions.length);
    
    // Verify all results contain the search term
    filteredInteractions.forEach((interaction, index) => {
      cy.get('[data-testid="finder-table"] tbody tr').eq(index).within(() => {
        cy.get('td').eq(0).should('contain', interaction.title);
      });
    });
  });

  it('should show "no results" message when search returns nothing', () => {
    const noResultsSearchTerm = 'xyz123_nonexistent';
    
    // Mock empty search results
    cy.intercept('GET', `/api/interactions*search=${noResultsSearchTerm}*`, {
      status: 'success',
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 0,
          totalRecords: 0
        }
      }
    }).as('emptySearch');
    
    // Perform search with non-existent term
    cy.get('[data-testid="search-input"]').type(noResultsSearchTerm);
    cy.get('[data-testid="search-button"]').click();
    
    // Wait for search results
    cy.wait('@emptySearch');
    
    // Verify empty state message
    cy.get('[data-testid="no-results-message"]').should('be.visible');
    cy.get('[data-testid="no-results-message"]').should('contain', 'No interactions match your search criteria');
    
    // Verify clear search button
    cy.get('[data-testid="clear-search-button"]').should('be.visible');
    
    // Click clear search
    cy.get('[data-testid="clear-search-button"]').click();
    
    // Verify original results are loaded
    cy.wait('@getInteractions');
    cy.get('[data-testid="finder-table"] tbody tr').should('exist');
    cy.get('[data-testid="no-results-message"]').should('not.exist');
  });

  it('should allow using advanced filters', () => {
    // Mock filtered results
    const filteredData = interactions.filter(i => i.type === 'Meeting' && i.lead.includes('Smith'));
    cy.intercept('GET', '/api/interactions*type=Meeting*lead=Smith*', {
      status: 'success',
      data: filteredData,
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: filteredData.length
        }
      }
    }).as('filteredResults');
    
    // Open advanced filters
    cy.get('[data-testid="advanced-filters-button"]').click();
    
    // Set filters
    cy.get('[data-testid="filter-type"]').select('Meeting');
    cy.get('[data-testid="filter-lead"]').type('Smith');
    
    // Apply filters
    cy.get('[data-testid="apply-filters-button"]').click();
    
    // Wait for filtered results
    cy.wait('@filteredResults');
    
    // Verify filter tags
    cy.get('[data-testid="filter-tag"]').should('have.length', 2);
    cy.get('[data-testid="filter-tag"]').eq(0).should('contain', 'Type: Meeting');
    cy.get('[data-testid="filter-tag"]').eq(1).should('contain', 'Lead: Smith');
    
    // Verify filtered results
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', filteredData.length);
    
    // Remove a filter tag
    cy.get('[data-testid="filter-tag"]').eq(0).find('[data-testid="remove-filter"]').click();
    
    // Verify filter tag was removed
    cy.get('[data-testid="filter-tag"]').should('have.length', 1);
  });

  it('should sort interactions by column', () => {
    // Mock sorted results
    const sortedByTitleAsc = [...interactions].sort((a, b) => a.title.localeCompare(b.title));
    const sortedByTitleDesc = [...interactions].sort((a, b) => b.title.localeCompare(a.title));
    
    // Intercept sort by title ascending
    cy.intercept('GET', '/api/interactions*sort=title&direction=asc*', {
      status: 'success',
      data: sortedByTitleAsc.slice(0, 5),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: 5
        }
      }
    }).as('sortTitleAsc');
    
    // Intercept sort by title descending
    cy.intercept('GET', '/api/interactions*sort=title&direction=desc*', {
      status: 'success',
      data: sortedByTitleDesc.slice(0, 5),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: 5
        }
      }
    }).as('sortTitleDesc');
    
    // Click title column header to sort ascending
    cy.get('[data-testid="column-header-title"]').click();
    
    // Wait for sorted results
    cy.wait('@sortTitleAsc');
    
    // Verify sort indicator
    cy.get('[data-testid="column-header-title"]').find('[data-testid="sort-indicator-asc"]').should('be.visible');
    
    // Verify sorted data
    cy.get('[data-testid="finder-table"] tbody tr').first().find('td').eq(0).should('contain', sortedByTitleAsc[0].title);
    
    // Click again to sort descending
    cy.get('[data-testid="column-header-title"]').click();
    
    // Wait for sorted results
    cy.wait('@sortTitleDesc');
    
    // Verify sort indicator changed
    cy.get('[data-testid="column-header-title"]').find('[data-testid="sort-indicator-desc"]').should('be.visible');
    
    // Verify sorted data
    cy.get('[data-testid="finder-table"] tbody tr').first().find('td').eq(0).should('contain', sortedByTitleDesc[0].title);
  });

  it('should navigate between pages of interactions', () => {
    // Total of 15 interactions, 5 per page = 3 pages
    const page1Data = interactions.slice(0, 5);
    const page2Data = interactions.slice(5, 10);
    const page3Data = interactions.slice(10, 15);
    
    // Mock page 1 data (default)
    cy.intercept('GET', '/api/interactions*page=1*', {
      status: 'success',
      data: page1Data,
      meta: {
        pagination: {
          page: 1,
          pageSize: 5,
          totalPages: 3,
          totalRecords: 15
        }
      }
    }).as('getPage1');
    
    // Mock page 2 data
    cy.intercept('GET', '/api/interactions*page=2*', {
      status: 'success',
      data: page2Data,
      meta: {
        pagination: {
          page: 2,
          pageSize: 5,
          totalPages: 3,
          totalRecords: 15
        }
      }
    }).as('getPage2');
    
    // Reload to get page 1 with 5 items per page
    cy.visit('/finder?pageSize=5');
    cy.wait('@getPage1');
    
    // Verify current page indicator
    cy.get('[data-testid="pagination-current-page"]').should('contain', '1');
    
    // Verify page 1 data
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', 5);
    cy.get('[data-testid="finder-table"] tbody tr').first().find('td').eq(0).should('contain', page1Data[0].title);
    
    // Click next page
    cy.get('[data-testid="pagination-next"]').click();
    
    // Wait for page 2 data
    cy.wait('@getPage2');
    
    // Verify current page indicator updated
    cy.get('[data-testid="pagination-current-page"]').should('contain', '2');
    
    // Verify page 2 data
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', 5);
    cy.get('[data-testid="finder-table"] tbody tr').first().find('td').eq(0).should('contain', page2Data[0].title);
  });

  it('should allow changing items per page', () => {
    // Mock results with 10 items per page
    cy.intercept('GET', '/api/interactions*pageSize=10*', {
      status: 'success',
      data: interactions.slice(0, 10),
      meta: {
        pagination: {
          page: 1,
          pageSize: 10,
          totalPages: 2,
          totalRecords: 15
        }
      }
    }).as('getPageSize10');
    
    // Select 10 items per page
    cy.get('[data-testid="page-size-select"]').select('10');
    
    // Wait for results
    cy.wait('@getPageSize10');
    
    // Verify number of rows
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', 10);
    
    // Verify pagination info updated
    cy.get('[data-testid="pagination-info"]').should('contain', 'Showing 1-10 of 15');
  });

  it('should navigate to interaction form on row click', () => {
    // Mock single interaction response
    cy.intercept('GET', '/api/interactions/1', {
      status: 'success',
      data: interactions[0]
    }).as('getInteraction');
    
    // Click on first row
    cy.get('[data-testid="finder-table"] tbody tr').first().click();
    
    // Verify navigation to edit page
    cy.url().should('include', '/interactions/edit/1');
    
    // Verify interaction data was fetched
    cy.wait('@getInteraction');
  });

  it('should navigate to create form when clicking new interaction', () => {
    // Click new interaction button
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Verify navigation to create page
    cy.url().should('include', '/interactions/create');
    
    // Verify form is empty
    cy.get('[data-testid="title-input"]').should('have.value', '');
    cy.get('[data-testid="type-select"]').should('exist');
    cy.get('[data-testid="lead-input"]').should('have.value', '');
  });

  it('should only display interactions for the current site', () => {
    const site1Interactions = interactions.filter(i => i.siteId === 1);
    const site2Interactions = interactions.filter(i => i.siteId === 2);
    
    // Mock site 1 interactions
    cy.intercept('GET', '/api/interactions*siteId=1*', {
      status: 'success',
      data: site1Interactions,
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: site1Interactions.length
        }
      }
    }).as('getSite1Interactions');
    
    // Mock site 2 interactions
    cy.intercept('GET', '/api/interactions*siteId=2*', {
      status: 'success',
      data: site2Interactions,
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: site2Interactions.length
        }
      }
    }).as('getSite2Interactions');
    
    // Verify current site in header
    cy.get('[data-testid="current-site"]').should('contain', 'Marketing');
    
    // Verify site 1 interactions are displayed
    cy.wait('@getSite1Interactions');
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', site1Interactions.length);
    
    // Switch site
    cy.get('[data-testid="site-selector"]').click();
    cy.contains('Sales').click();
    cy.get('[data-testid="switch-site-button"]').click();
    
    // Verify site context changed
    cy.get('[data-testid="current-site"]').should('contain', 'Sales');
    
    // Verify site 2 interactions are displayed
    cy.wait('@getSite2Interactions');
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', site2Interactions.length);
  });

  it('should persist search and filter state when changing pages', () => {
    const searchTerm = 'Meeting';
    const filteredData = interactions.filter(i => 
      i.title.includes(searchTerm) || 
      i.type.includes(searchTerm) || 
      i.description.includes(searchTerm)
    );
    
    // At least 6 items to have multiple pages
    const page1Data = filteredData.slice(0, 5);
    const page2Data = filteredData.slice(5, 10);
    
    // Mock search results page 1
    cy.intercept('GET', `/api/interactions*search=${searchTerm}*page=1*`, {
      status: 'success',
      data: page1Data,
      meta: {
        pagination: {
          page: 1,
          pageSize: 5,
          totalPages: 2,
          totalRecords: filteredData.length
        }
      }
    }).as('searchPage1');
    
    // Mock search results page 2
    cy.intercept('GET', `/api/interactions*search=${searchTerm}*page=2*`, {
      status: 'success',
      data: page2Data,
      meta: {
        pagination: {
          page: 2,
          pageSize: 5,
          totalPages: 2,
          totalRecords: filteredData.length
        }
      }
    }).as('searchPage2');
    
    // Perform search
    cy.get('[data-testid="search-input"]').type(searchTerm);
    cy.get('[data-testid="search-button"]').click();
    
    // Wait for search results
    cy.wait('@searchPage1');
    
    // Verify results
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', page1Data.length);
    
    // Navigate to page 2
    cy.get('[data-testid="pagination-next"]').click();
    
    // Wait for page 2 results
    cy.wait('@searchPage2');
    
    // Verify page 2 results
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', page2Data.length);
    
    // Verify search term is still in the input
    cy.get('[data-testid="search-input"]').should('have.value', searchTerm);
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 500,
      body: {
        status: 'error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      }
    }).as('apiError');
    
    // Reload page to trigger error
    cy.visit('/finder');
    
    // Wait for error response
    cy.wait('@apiError');
    
    // Verify error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'An unexpected error occurred');
    
    // Verify retry button
    cy.get('[data-testid="retry-button"]').should('be.visible');
    
    // Mock successful response for retry
    cy.intercept('GET', '/api/interactions*', {
      status: 'success',
      data: interactions.slice(0, 5),
      meta: {
        pagination: {
          page: 1,
          pageSize: 25,
          totalPages: 1,
          totalRecords: 5
        }
      }
    }).as('retrySuccess');
    
    // Click retry
    cy.get('[data-testid="retry-button"]').click();
    
    // Wait for successful response
    cy.wait('@retrySuccess');
    
    // Verify table is now visible
    cy.get('[data-testid="finder-table"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('not.exist');
  });
});