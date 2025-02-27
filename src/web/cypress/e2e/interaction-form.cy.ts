import '../support/e2e';
import interactions from '../fixtures/interactions.json';
import users from '../fixtures/users.json';

describe('Interaction Form', () => {
  beforeEach(() => {
    // Login before each test
    cy.login(users[0].username, users[0].password);
    
    // Intercept API requests for interactions
    cy.intercept('GET', '/api/interactions*').as('getInteractions');
    cy.intercept('POST', '/api/interactions').as('createInteraction');
    cy.intercept('PUT', '/api/interactions/*').as('updateInteraction');
    cy.intercept('DELETE', '/api/interactions/*').as('deleteInteraction');
    
    // Start at the finder page
    cy.visit('/finder');
    cy.wait('@getInteractions');
    cy.get('[data-testid="finder-table"]').should('be.visible');
  });
  
  it('should navigate to creation form from finder', () => {
    // Click the New Interaction button
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Verify we're on the interaction form page
    cy.url().should('include', '/interactions/new');
    
    // Check that form is rendered with empty fields
    cy.get('[data-testid="interaction-form"]').should('be.visible');
    cy.get('[data-testid="title-input"]').should('be.empty');
    cy.get('[data-testid="form-title"]').should('contain', 'Create Interaction');
    cy.get('[data-testid="back-button"]').should('be.visible');
  });
  
  it('should create a new interaction with all fields', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Intercept the POST request
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 100,
            title: 'Test Meeting',
            type: 'MEETING',
            lead: 'John Doe',
            startDateTime: '2023-09-10T10:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-10T11:00:00',
            location: 'Conference Room',
            description: 'Test description',
            notes: 'Test notes',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('createInteraction');
    
    // Fill in the form fields
    cy.get('[data-testid="title-input"]').type('Test Meeting');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('John Doe');
    cy.get('[data-testid="start-date-input"]').type('2023-09-10');
    cy.get('[data-testid="start-time-input"]').type('10:00');
    cy.get('[data-testid="timezone-select"]').select('America/New_York');
    cy.get('[data-testid="end-date-input"]').type('2023-09-10');
    cy.get('[data-testid="end-time-input"]').type('11:00');
    cy.get('[data-testid="location-input"]').type('Conference Room');
    cy.get('[data-testid="description-input"]').type('Test description');
    cy.get('[data-testid="notes-input"]').type('Test notes');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify request body
    cy.wait('@createInteraction').its('request.body').should('deep.include', {
      title: 'Test Meeting',
      type: 'MEETING',
      lead: 'John Doe',
      startDateTime: '2023-09-10T10:00:00',
      timezone: 'America/New_York',
      endDateTime: '2023-09-10T11:00:00',
      location: 'Conference Room',
      description: 'Test description',
      notes: 'Test notes'
    });
    
    // Verify success message and redirect
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.url().should('include', '/finder');
  });
  
  it('should associate new interaction with current site', () => {
    // Check current site context
    cy.get('[data-testid="current-site"]').invoke('text').then((siteName) => {
      // Navigate to create form
      cy.get('[data-testid="new-interaction-button"]').click();
      
      // Intercept the POST request
      cy.intercept('POST', '/api/interactions', (req) => {
        expect(req.body.siteId).to.equal(1); // Assuming site ID 1 is Marketing
        req.reply({
          statusCode: 201,
          body: {
            status: 'success',
            data: {
              interaction: {
                id: 101,
                title: 'Site Test',
                type: 'MEETING',
                lead: 'Site Lead',
                startDateTime: '2023-09-11T09:00:00',
                timezone: 'America/New_York',
                endDateTime: '2023-09-11T10:00:00',
                location: 'Test Location',
                description: 'Test description',
                notes: 'Test notes',
                siteId: 1,
                createdBy: 1,
                createdAt: new Date().toISOString()
              }
            }
          }
        });
      }).as('createInteractionWithSite');
      
      // Fill required fields
      cy.get('[data-testid="title-input"]').type('Site Test');
      cy.get('[data-testid="type-select"]').select('MEETING');
      cy.get('[data-testid="lead-input"]').type('Site Lead');
      cy.get('[data-testid="start-date-input"]').type('2023-09-11');
      cy.get('[data-testid="start-time-input"]').type('09:00');
      cy.get('[data-testid="end-date-input"]').type('2023-09-11');
      cy.get('[data-testid="end-time-input"]').type('10:00');
      
      // Submit form
      cy.get('[data-testid="save-button"]').click();
      
      // Verify request was made with site context
      cy.wait('@createInteractionWithSite');
      
      // Verify we return to finder with success message
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.url().should('include', '/finder');
    });
  });
  
  it('should validate required form fields', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Try to submit empty form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify validation errors
    cy.get('[data-testid="title-error"]').should('be.visible');
    cy.get('[data-testid="type-error"]').should('be.visible');
    cy.get('[data-testid="lead-error"]').should('be.visible');
    cy.get('[data-testid="start-date-error"]').should('be.visible');
    cy.get('[data-testid="end-date-error"]').should('be.visible');
    
    // Fill in only some required fields
    cy.get('[data-testid="title-input"]').type('Validation Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    
    // Try to submit again
    cy.get('[data-testid="save-button"]').click();
    
    // Verify remaining validation errors
    cy.get('[data-testid="title-error"]').should('not.exist');
    cy.get('[data-testid="type-error"]').should('not.exist');
    cy.get('[data-testid="lead-error"]').should('be.visible');
    cy.get('[data-testid="start-date-error"]').should('be.visible');
    cy.get('[data-testid="end-date-error"]').should('be.visible');
    
    // Fill in remaining required fields
    cy.get('[data-testid="lead-input"]').type('Validation Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-12');
    cy.get('[data-testid="start-time-input"]').type('13:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-12');
    cy.get('[data-testid="end-time-input"]').type('14:00');
    
    // Intercept POST request to allow submission
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 102,
            title: 'Validation Test',
            type: 'MEETING',
            lead: 'Validation Lead',
            startDateTime: '2023-09-12T13:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-12T14:00:00',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('createValidatedInteraction');
    
    // Submit with all required fields
    cy.get('[data-testid="save-button"]').click();
    
    // Verify successful submission
    cy.wait('@createValidatedInteraction');
    cy.url().should('include', '/finder');
  });
  
  it('should validate date constraints', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in all fields except dates
    cy.get('[data-testid="title-input"]').type('Date Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('Date Lead');
    
    // Set end date earlier than start date
    cy.get('[data-testid="start-date-input"]').type('2023-09-15');
    cy.get('[data-testid="start-time-input"]').type('14:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-15');
    cy.get('[data-testid="end-time-input"]').type('13:00');
    
    // Try to submit
    cy.get('[data-testid="save-button"]').click();
    
    // Verify date validation error
    cy.get('[data-testid="end-date-error"]').should('be.visible')
      .and('contain', 'End date/time must be after start date/time');
    
    // Fix the date constraint
    cy.get('[data-testid="end-time-input"]').clear().type('15:00');
    
    // Intercept POST request to allow submission
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 103,
            title: 'Date Test',
            type: 'MEETING',
            lead: 'Date Lead',
            startDateTime: '2023-09-15T14:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-15T15:00:00',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('createDateValidatedInteraction');
    
    // Submit with valid dates
    cy.get('[data-testid="save-button"]').click();
    
    // Verify successful submission
    cy.wait('@createDateValidatedInteraction');
    cy.url().should('include', '/finder');
  });
  
  it('should allow timezone selection', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in required fields
    cy.get('[data-testid="title-input"]').type('Timezone Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('Timezone Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-16');
    cy.get('[data-testid="start-time-input"]').type('09:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-16');
    cy.get('[data-testid="end-time-input"]').type('10:00');
    
    // Select a specific timezone
    cy.get('[data-testid="timezone-select"]').select('America/Los_Angeles');
    
    // Verify the timezone is selected
    cy.get('[data-testid="timezone-select"]').should('have.value', 'America/Los_Angeles');
    
    // Intercept POST request
    cy.intercept('POST', '/api/interactions', (req) => {
      expect(req.body.timezone).to.equal('America/Los_Angeles');
      req.reply({
        statusCode: 201,
        body: {
          status: 'success',
          data: {
            interaction: {
              id: 104,
              title: 'Timezone Test',
              type: 'MEETING',
              lead: 'Timezone Lead',
              startDateTime: '2023-09-16T09:00:00',
              timezone: 'America/Los_Angeles',
              endDateTime: '2023-09-16T10:00:00',
              siteId: 1,
              createdBy: 1,
              createdAt: new Date().toISOString()
            }
          }
        }
      });
    }).as('createTimezoneInteraction');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify request includes timezone
    cy.wait('@createTimezoneInteraction');
  });
  
  it('should navigate to edit form from finder', () => {
    // Mock the interactions list
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interactions: [interactions[0]], // Use first interaction from fixture
          meta: {
            pagination: {
              page: 1,
              pageSize: 25,
              totalPages: 1,
              totalRecords: 1
            }
          }
        }
      }
    }).as('getInteractions');
    
    // Refresh finder to use our mocked data
    cy.visit('/finder');
    cy.wait('@getInteractions');
    
    // Find the interaction in the table and click edit
    cy.get('[data-testid="finder-table"]')
      .contains(interactions[0].title)
      .parents('tr')
      .find('[data-testid="edit-button"]')
      .click();
    
    // Intercept the GET request for the specific interaction
    cy.intercept('GET', `/api/interactions/${interactions[0].id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: interactions[0]
        }
      }
    }).as('getInteractionDetail');
    
    // Verify we're on the edit page with correct ID
    cy.url().should('include', `/interactions/${interactions[0].id}`);
    cy.wait('@getInteractionDetail');
    
    // Verify form is populated
    cy.get('[data-testid="interaction-form"]').should('be.visible');
    cy.get('[data-testid="form-title"]').should('contain', 'Edit Interaction');
  });
  
  it('should load existing interaction data in edit form', () => {
    // Mock the GET request for a specific interaction
    const interaction = interactions[0];
    cy.intercept('GET', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: interaction
        }
      }
    }).as('getInteractionDetail');
    
    // Navigate directly to the edit form
    cy.visit(`/interactions/${interaction.id}`);
    cy.wait('@getInteractionDetail');
    
    // Verify form fields are populated with interaction data
    cy.get('[data-testid="title-input"]').should('have.value', interaction.title);
    cy.get('[data-testid="type-select"]').should('have.value', interaction.type);
    cy.get('[data-testid="lead-input"]').should('have.value', interaction.lead);
    
    // Extract date parts for verification
    const startDate = new Date(interaction.startDateTime);
    const endDate = new Date(interaction.endDateTime);
    
    // Verify date fields
    cy.get('[data-testid="start-date-input"]').should('have.value', startDate.toISOString().split('T')[0]);
    cy.get('[data-testid="timezone-select"]').should('have.value', interaction.timezone);
    cy.get('[data-testid="end-date-input"]').should('have.value', endDate.toISOString().split('T')[0]);
    cy.get('[data-testid="location-input"]').should('have.value', interaction.location);
    cy.get('[data-testid="description-input"]').should('have.value', interaction.description);
    cy.get('[data-testid="notes-input"]').should('have.value', interaction.notes);
    
    // Verify form is in edit mode
    cy.get('[data-testid="form-title"]').should('contain', 'Edit Interaction');
  });
  
  it('should update an existing interaction', () => {
    // Mock the GET request for a specific interaction
    const interaction = interactions[0];
    cy.intercept('GET', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: interaction
        }
      }
    }).as('getInteractionDetail');
    
    // Navigate to the edit form
    cy.visit(`/interactions/${interaction.id}`);
    cy.wait('@getInteractionDetail');
    
    // Modify form fields
    cy.get('[data-testid="title-input"]').clear().type('Updated Title');
    cy.get('[data-testid="lead-input"]').clear().type('Updated Lead');
    cy.get('[data-testid="description-input"]').clear().type('Updated description');
    
    // Intercept the PUT request
    cy.intercept('PUT', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: {
            ...interaction,
            title: 'Updated Title',
            lead: 'Updated Lead',
            description: 'Updated description',
            updatedAt: new Date().toISOString()
          }
        }
      }
    }).as('updateInteraction');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify request body includes updates
    cy.wait('@updateInteraction').its('request.body').should('deep.include', {
      title: 'Updated Title',
      lead: 'Updated Lead',
      description: 'Updated description'
    });
    
    // Verify success message and redirect
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.url().should('include', '/finder');
  });
  
  it('should handle API validation errors', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in the form fields
    cy.get('[data-testid="title-input"]').type('API Validation Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('API Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-17');
    cy.get('[data-testid="start-time-input"]').type('11:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-17');
    cy.get('[data-testid="end-time-input"]').type('12:00');
    
    // Intercept the POST request with a validation error
    cy.intercept('POST', '/api/interactions', {
      statusCode: 400,
      body: {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            { field: 'title', message: 'Title already exists' }
          ]
        }
      }
    }).as('createWithValidationError');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify API validation error is displayed
    cy.wait('@createWithValidationError');
    cy.get('[data-testid="title-error"]').should('be.visible')
      .and('contain', 'Title already exists');
    
    // Correct the field with error
    cy.get('[data-testid="title-input"]').clear().type('Unique Title');
    
    // Intercept with success this time
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 105,
            title: 'Unique Title',
            type: 'MEETING',
            lead: 'API Lead',
            startDateTime: '2023-09-17T11:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-17T12:00:00',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('createSuccessAfterValidation');
    
    // Submit again
    cy.get('[data-testid="save-button"]').click();
    
    // Verify successful submission
    cy.wait('@createSuccessAfterValidation');
    cy.url().should('include', '/finder');
  });
  
  it('should cancel creation and return to finder', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in some form fields
    cy.get('[data-testid="title-input"]').type('Cancel Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    
    // Click cancel button
    cy.get('[data-testid="cancel-button"]').click();
    
    // Verify we return to finder without making API call
    cy.url().should('include', '/finder');
    cy.get('@createInteraction.all').should('have.length', 0);
  });
  
  it('should display delete confirmation when deleting', () => {
    // Mock the GET request for a specific interaction
    const interaction = interactions[0];
    cy.intercept('GET', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: interaction
        }
      }
    }).as('getInteractionDetail');
    
    // Navigate to the edit form
    cy.visit(`/interactions/${interaction.id}`);
    cy.wait('@getInteractionDetail');
    
    // Click delete button
    cy.get('[data-testid="delete-button"]').click();
    
    // Verify confirmation dialog appears
    cy.get('[data-testid="delete-confirmation-dialog"]').should('be.visible');
    cy.get('[data-testid="delete-confirmation-dialog"]').should('contain', interaction.title);
    cy.get('[data-testid="confirm-delete-button"]').should('be.visible');
    cy.get('[data-testid="cancel-delete-button"]').should('be.visible');
  });
  
  it('should cancel deletion when clicking cancel', () => {
    // Mock the GET request for a specific interaction
    const interaction = interactions[0];
    cy.intercept('GET', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: interaction
        }
      }
    }).as('getInteractionDetail');
    
    // Navigate to the edit form
    cy.visit(`/interactions/${interaction.id}`);
    cy.wait('@getInteractionDetail');
    
    // Click delete button
    cy.get('[data-testid="delete-button"]').click();
    
    // Verify confirmation dialog appears
    cy.get('[data-testid="delete-confirmation-dialog"]').should('be.visible');
    
    // Click cancel button
    cy.get('[data-testid="cancel-delete-button"]').click();
    
    // Verify dialog closes and we're still on edit form
    cy.get('[data-testid="delete-confirmation-dialog"]').should('not.exist');
    cy.get('[data-testid="interaction-form"]').should('be.visible');
    cy.url().should('include', `/interactions/${interaction.id}`);
    
    // Verify no delete API call was made
    cy.get('@deleteInteraction.all').should('have.length', 0);
  });
  
  it('should delete interaction when confirming deletion', () => {
    // Mock the GET request for a specific interaction
    const interaction = interactions[0];
    cy.intercept('GET', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          interaction: interaction
        }
      }
    }).as('getInteractionDetail');
    
    // Navigate to the edit form
    cy.visit(`/interactions/${interaction.id}`);
    cy.wait('@getInteractionDetail');
    
    // Click delete button
    cy.get('[data-testid="delete-button"]').click();
    
    // Verify confirmation dialog appears
    cy.get('[data-testid="delete-confirmation-dialog"]').should('be.visible');
    
    // Intercept the DELETE request
    cy.intercept('DELETE', `/api/interactions/${interaction.id}`, {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          success: true
        }
      }
    }).as('deleteInteraction');
    
    // Click confirm button
    cy.get('[data-testid="confirm-delete-button"]').click();
    
    // Verify DELETE request was made
    cy.wait('@deleteInteraction');
    
    // Verify success message and redirect to finder
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.url().should('include', '/finder');
  });
  
  it('should show loading states during API operations', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in required fields
    cy.get('[data-testid="title-input"]').type('Loading Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('Loading Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-18');
    cy.get('[data-testid="start-time-input"]').type('13:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-18');
    cy.get('[data-testid="end-time-input"]').type('14:00');
    
    // Intercept with a delayed response
    cy.intercept('POST', '/api/interactions', (req) => {
      // Delay the response by 2 seconds
      req.reply({
        delay: 2000,
        statusCode: 201,
        body: {
          status: 'success',
          data: {
            interaction: {
              id: 106,
              title: 'Loading Test',
              type: 'MEETING',
              lead: 'Loading Lead',
              startDateTime: '2023-09-18T13:00:00',
              timezone: 'America/New_York',
              endDateTime: '2023-09-18T14:00:00',
              siteId: 1,
              createdBy: 1,
              createdAt: new Date().toISOString()
            }
          }
        }
      });
    }).as('delayedCreate');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify loading state
    cy.get('[data-testid="loading-indicator"]').should('be.visible');
    cy.get('[data-testid="save-button"]').should('be.disabled');
    
    // Wait for response
    cy.wait('@delayedCreate');
    
    // Verify loading indicator disappears
    cy.get('[data-testid="loading-indicator"]').should('not.exist');
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
  
  it('should handle API errors gracefully', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in required fields
    cy.get('[data-testid="title-input"]').type('Error Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('Error Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-19');
    cy.get('[data-testid="start-time-input"]').type('15:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-19');
    cy.get('[data-testid="end-time-input"]').type('16:00');
    
    // Intercept with a server error
    cy.intercept('POST', '/api/interactions', {
      statusCode: 500,
      body: {
        status: 'error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      }
    }).as('errorCreate');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify error notification
    cy.wait('@errorCreate');
    cy.get('[data-testid="error-message"]').should('be.visible');
    
    // Verify form is still editable
    cy.get('[data-testid="title-input"]').should('have.value', 'Error Test');
    cy.get('[data-testid="save-button"]').should('not.be.disabled');
    
    // Intercept with success for retry
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 107,
            title: 'Error Test',
            type: 'MEETING',
            lead: 'Error Lead',
            startDateTime: '2023-09-19T15:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-19T16:00:00',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('retryCreate');
    
    // Submit again
    cy.get('[data-testid="save-button"]').click();
    
    // Verify successful submission on retry
    cy.wait('@retryCreate');
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.url().should('include', '/finder');
  });
  
  it('should save and create new interaction when clicking Save & New', () => {
    // Navigate to create form
    cy.get('[data-testid="new-interaction-button"]').click();
    
    // Fill in required fields
    cy.get('[data-testid="title-input"]').type('Save and New Test');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('Save and New Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-20');
    cy.get('[data-testid="start-time-input"]').type('10:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-20');
    cy.get('[data-testid="end-time-input"]').type('11:00');
    
    // Intercept the POST request
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 108,
            title: 'Save and New Test',
            type: 'MEETING',
            lead: 'Save and New Lead',
            startDateTime: '2023-09-20T10:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-20T11:00:00',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('createSaveAndNewInteraction');
    
    // Click Save & New
    cy.get('[data-testid="save-and-new-button"]').click();
    
    // Verify request was made
    cy.wait('@createSaveAndNewInteraction');
    
    // Verify success message
    cy.get('[data-testid="success-message"]').should('be.visible');
    
    // Verify we're still on the create page with cleared fields
    cy.url().should('include', '/interactions/new');
    cy.get('[data-testid="title-input"]').should('be.empty');
    cy.get('[data-testid="lead-input"]').should('be.empty');
    
    // Verify we can create another interaction
    cy.get('[data-testid="title-input"]').type('Second Interaction');
    cy.get('[data-testid="type-select"]').select('MEETING');
    cy.get('[data-testid="lead-input"]').type('Second Lead');
    cy.get('[data-testid="start-date-input"]').type('2023-09-21');
    cy.get('[data-testid="start-time-input"]').type('11:00');
    cy.get('[data-testid="end-date-input"]').type('2023-09-21');
    cy.get('[data-testid="end-time-input"]').type('12:00');
    
    // Intercept second interaction creation
    cy.intercept('POST', '/api/interactions', {
      statusCode: 201,
      body: {
        status: 'success',
        data: {
          interaction: {
            id: 109,
            title: 'Second Interaction',
            type: 'MEETING',
            lead: 'Second Lead',
            startDateTime: '2023-09-21T11:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-21T12:00:00',
            siteId: 1,
            createdBy: 1,
            createdAt: new Date().toISOString()
          }
        }
      }
    }).as('createSecondInteraction');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Verify second interaction created successfully
    cy.wait('@createSecondInteraction');
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.url().should('include', '/finder');
  });
});