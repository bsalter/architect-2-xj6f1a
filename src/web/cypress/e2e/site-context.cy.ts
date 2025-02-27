/**
 * E2E tests for site context functionality including site selection,
 * context switching, and data filtering based on the selected site
 * 
 * cypress version: ^12.0.0
 */

describe('Site Context Functionality', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.intercept('GET', '/api/auth/sites').as('sitesRequest');
    cy.intercept('GET', '/api/interactions*').as('interactionsRequest');
    cy.intercept('POST', '/api/interactions').as('createInteractionRequest');
    cy.intercept('POST', '/api/auth/site').as('setSiteRequest');
    
    // Load fixtures for test data
    cy.fixture('users.json').as('usersFixture');
    cy.fixture('sites.json').as('sitesFixture');
    cy.fixture('interactions.json').as('interactionsFixture');
  });

  it('should redirect to site selection for multi-site users', () => {
    // Prepare a multi-site user response
    const multiSiteUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' },
        { id: 2, name: 'Sales', role: 'Editor' }
      ]
    };
    
    // Stub login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: multiSiteUser
      }
    }).as('loginRequest');
    
    // Visit login page
    cy.visit('/login');
    
    // Enter credentials and submit
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login request to complete
    cy.wait('@loginRequest');
    
    // Verify redirection to site selection page
    cy.url().should('include', '/site-selection');
    
    // Verify available sites are displayed
    cy.get('[data-testid="site-dropdown"]').should('be.visible');
    cy.get('[data-testid="site-dropdown"] option').should('have.length', 2);
    cy.get('[data-testid="site-dropdown"] option').first().should('have.text', 'Marketing');
    cy.get('[data-testid="site-dropdown"] option').eq(1).should('have.text', 'Sales');
  });

  it('should allow selecting a site from the selection page', () => {
    // Prepare a multi-site user response
    const multiSiteUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' },
        { id: 2, name: 'Sales', role: 'Editor' }
      ]
    };
    
    // Stub login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: multiSiteUser
      }
    }).as('loginRequest');
    
    // Stub sites response
    cy.intercept('GET', '/api/auth/sites', {
      statusCode: 200,
      body: {
        sites: multiSiteUser.sites
      }
    }).as('sitesRequest');
    
    // Stub interactions response
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 200,
      body: {
        interactions: [],
        total: 0,
        page: 1,
        pageSize: 25
      }
    }).as('interactionsRequest');
    
    // Visit login page and log in
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for redirection to site selection
    cy.url().should('include', '/site-selection');
    
    // Select "Sales" site from dropdown
    cy.get('[data-testid="site-dropdown"]').select('Sales');
    
    // Click continue button
    cy.get('[data-testid="continue-button"]').click();
    
    // Verify redirection to finder page
    cy.url().should('include', '/finder');
    
    // Verify selected site is shown in header
    cy.get('[data-testid="current-site"]').should('contain.text', 'Sales');
  });

  it('should filter interactions by the selected site', () => {
    // Prepare a multi-site user response
    const multiSiteUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' },
        { id: 2, name: 'Sales', role: 'Editor' }
      ]
    };
    
    // Sample interactions for different sites
    const marketingInteractions = [
      {
        id: 1,
        title: 'Marketing Meeting',
        type: 'Meeting',
        lead: 'John Smith',
        startDateTime: '2023-08-15T10:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-15T11:00:00',
        location: 'Conference Room A',
        description: 'Discuss marketing strategy',
        notes: 'Bring marketing materials',
        siteId: 1
      },
      {
        id: 2,
        title: 'Marketing Campaign Review',
        type: 'Review',
        lead: 'Jane Doe',
        startDateTime: '2023-08-16T14:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-16T15:30:00',
        location: 'Conference Room B',
        description: 'Review Q3 campaign results',
        notes: 'Prepare statistics',
        siteId: 1
      }
    ];
    
    const salesInteractions = [
      {
        id: 3,
        title: 'Sales Team Meeting',
        type: 'Meeting',
        lead: 'Robert Johnson',
        startDateTime: '2023-08-17T09:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-17T10:00:00',
        location: 'Conference Room C',
        description: 'Weekly sales update',
        notes: 'Bring sales figures',
        siteId: 2
      },
      {
        id: 4,
        title: 'Client Pitch',
        type: 'Presentation',
        lead: 'Sarah Williams',
        startDateTime: '2023-08-18T11:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-18T12:00:00',
        location: 'Client Office',
        description: 'Present proposal to new client',
        notes: 'Bring proposal documents',
        siteId: 2
      }
    ];
    
    // Stub login response
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: multiSiteUser
      }
    }).as('loginRequest');
    
    // Stub sites response
    cy.intercept('GET', '/api/auth/sites', {
      statusCode: 200,
      body: {
        sites: multiSiteUser.sites
      }
    }).as('sitesRequest');
    
    // Stub interactions response based on site_id parameter
    cy.intercept('GET', '/api/interactions*', (req) => {
      const url = new URL(req.url);
      const siteIdParam = url.searchParams.get('site_id');
      
      let interactions = [];
      if (siteIdParam === '1') {
        interactions = marketingInteractions;
      } else if (siteIdParam === '2') {
        interactions = salesInteractions;
      }
      
      return {
        statusCode: 200,
        body: {
          interactions: interactions,
          total: interactions.length,
          page: 1,
          pageSize: 25
        }
      };
    }).as('interactionsRequest');
    
    // Visit login page and log in
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    
    // On site selection page, select Marketing
    cy.url().should('include', '/site-selection');
    cy.get('[data-testid="site-dropdown"]').select('Marketing');
    cy.get('[data-testid="continue-button"]').click();
    
    // Wait for interactions request to complete
    cy.wait('@interactionsRequest').then((interception) => {
      // Verify the request contained the correct site_id
      const url = new URL(interception.request.url);
      expect(url.searchParams.get('site_id')).to.equal('1');
    });
    
    // Verify Marketing interactions are displayed
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', 2);
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Marketing Meeting');
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Marketing Campaign Review');
    cy.get('[data-testid="finder-table"]').should('not.contain.text', 'Sales Team Meeting');
    
    // Switch to Sales site
    cy.get('[data-testid="site-selector"]').click();
    cy.get('[data-testid="site-option-2"]').click(); // Assuming site option has id-based test id
    cy.get('[data-testid="switch-site-button"]').click();
    
    // Wait for interactions request to complete
    cy.wait('@interactionsRequest').then((interception) => {
      // Verify the request contained the correct site_id
      const url = new URL(interception.request.url);
      expect(url.searchParams.get('site_id')).to.equal('2');
    });
    
    // Verify Sales interactions are displayed
    cy.get('[data-testid="finder-table"] tbody tr').should('have.length', 2);
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Sales Team Meeting');
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Client Pitch');
    cy.get('[data-testid="finder-table"]').should('not.contain.text', 'Marketing Meeting');
  });

  it('should allow switching sites from the header', () => {
    const multiSiteUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' },
        { id: 2, name: 'Sales', role: 'Editor' }
      ]
    };
    
    // Sample interactions
    const marketingInteractions = [
      {
        id: 1,
        title: 'Marketing Meeting',
        type: 'Meeting',
        lead: 'John Smith',
        startDateTime: '2023-08-15T10:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-15T11:00:00',
        location: 'Conference Room A',
        description: 'Discuss marketing strategy',
        notes: 'Bring marketing materials',
        siteId: 1
      }
    ];
    
    const salesInteractions = [
      {
        id: 3,
        title: 'Sales Team Meeting',
        type: 'Meeting',
        lead: 'Robert Johnson',
        startDateTime: '2023-08-17T09:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-17T10:00:00',
        location: 'Conference Room C',
        description: 'Weekly sales update',
        notes: 'Bring sales figures',
        siteId: 2
      }
    ];
    
    // Stub login and API responses
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: multiSiteUser }
    }).as('loginRequest');
    
    cy.intercept('GET', '/api/auth/sites', {
      statusCode: 200,
      body: { sites: multiSiteUser.sites }
    }).as('sitesRequest');
    
    cy.intercept('POST', '/api/auth/site', {
      statusCode: 200,
      body: { success: true, currentSite: multiSiteUser.sites[1] }
    }).as('setSiteRequest');
    
    cy.intercept('GET', '/api/interactions*', (req) => {
      const url = new URL(req.url);
      const siteIdParam = url.searchParams.get('site_id');
      
      let interactions = siteIdParam === '1' ? marketingInteractions : salesInteractions;
      
      return {
        statusCode: 200,
        body: {
          interactions: interactions,
          total: interactions.length,
          page: 1,
          pageSize: 25
        }
      };
    }).as('interactionsRequest');
    
    // Login and navigate to finder with Marketing site
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/site-selection');
    cy.get('[data-testid="site-dropdown"]').select('Marketing');
    cy.get('[data-testid="continue-button"]').click();
    
    // Verify we're on the finder page with Marketing site
    cy.url().should('include', '/finder');
    cy.get('[data-testid="current-site"]').should('contain.text', 'Marketing');
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Marketing Meeting');
    
    // Click on the site selector in the header
    cy.get('[data-testid="site-selector"]').click();
    
    // Verify available sites are displayed
    cy.get('[data-testid="available-sites-dropdown"]').should('be.visible');
    cy.get('[data-testid="site-option-1"]').should('contain.text', 'Marketing');
    cy.get('[data-testid="site-option-2"]').should('contain.text', 'Sales');
    
    // Select Sales site
    cy.get('[data-testid="site-option-2"]').click();
    cy.get('[data-testid="switch-site-button"]').click();
    
    // Wait for site change request and interactions to be reloaded
    cy.wait('@setSiteRequest');
    cy.wait('@interactionsRequest');
    
    // Verify UI updates to show Sales site context
    cy.get('[data-testid="current-site"]').should('contain.text', 'Sales');
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Sales Team Meeting');
    cy.get('[data-testid="finder-table"]').should('not.contain.text', 'Marketing Meeting');
  });

  it('should persist site context when navigating between pages', () => {
    const multiSiteUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' },
        { id: 2, name: 'Sales', role: 'Editor' }
      ]
    };
    
    // Sample interactions for Marketing site
    const marketingInteractions = [
      {
        id: 1,
        title: 'Marketing Meeting',
        type: 'Meeting',
        lead: 'John Smith',
        startDateTime: '2023-08-15T10:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-15T11:00:00',
        location: 'Conference Room A',
        description: 'Discuss marketing strategy',
        notes: 'Bring marketing materials',
        siteId: 1
      }
    ];
    
    // Setup API stubs
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: multiSiteUser }
    }).as('loginRequest');
    
    cy.intercept('GET', '/api/auth/sites', {
      statusCode: 200,
      body: { sites: multiSiteUser.sites }
    }).as('sitesRequest');
    
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 200,
      body: {
        interactions: marketingInteractions,
        total: marketingInteractions.length,
        page: 1,
        pageSize: 25
      }
    }).as('interactionsRequest');
    
    // Login and select Marketing site
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/site-selection');
    cy.get('[data-testid="site-dropdown"]').select('Marketing');
    cy.get('[data-testid="continue-button"]').click();
    
    // Verify we're on the finder page with Marketing site
    cy.url().should('include', '/finder');
    cy.get('[data-testid="current-site"]').should('contain.text', 'Marketing');
    
    // Navigate to Create Interaction page
    cy.get('[data-testid="new-interaction-button"]').click();
    cy.url().should('include', '/interactions/new');
    
    // Verify site context is maintained
    cy.get('[data-testid="current-site"]').should('contain.text', 'Marketing');
    
    // Navigate back to finder
    cy.get('[data-testid="back-to-finder"]').click();
    cy.url().should('include', '/finder');
    
    // Verify site context is still maintained
    cy.get('[data-testid="current-site"]').should('contain.text', 'Marketing');
    
    // Verify interactions are still filtered by the Marketing site
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Marketing Meeting');
  });

  it('should create interactions in the context of the selected site', () => {
    const multiSiteUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' },
        { id: 2, name: 'Sales', role: 'Editor' }
      ]
    };
    
    // Setup API stubs
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token', user: multiSiteUser }
    }).as('loginRequest');
    
    cy.intercept('GET', '/api/auth/sites', {
      statusCode: 200,
      body: { sites: multiSiteUser.sites }
    }).as('sitesRequest');
    
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 200,
      body: {
        interactions: [],
        total: 0,
        page: 1,
        pageSize: 25
      }
    }).as('getInteractionsRequest');
    
    // Stub POST interactions response
    cy.intercept('POST', '/api/interactions', (req) => {
      // Return a success response with the created interaction
      return {
        statusCode: 201,
        body: {
          success: true,
          interaction: {
            id: 100,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      };
    }).as('createInteractionRequest');
    
    // Login and select Marketing site
    cy.visit('/login');
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/site-selection');
    cy.get('[data-testid="site-dropdown"]').select('Marketing');
    cy.get('[data-testid="continue-button"]').click();
    
    // Navigate to Create Interaction page
    cy.get('[data-testid="new-interaction-button"]').click();
    cy.url().should('include', '/interactions/new');
    
    // Complete the interaction form
    cy.get('[data-testid="title-input"]').type('New Marketing Webinar');
    cy.get('[data-testid="type-select"]').select('Meeting');
    cy.get('[data-testid="lead-input"]').type('John Smith');
    cy.get('[data-testid="start-date-input"]').type('2023-09-15');
    cy.get('[data-testid="start-time-input"]').type('10:00');
    cy.get('[data-testid="timezone-select"]').select('America/New_York');
    cy.get('[data-testid="end-date-input"]').type('2023-09-15');
    cy.get('[data-testid="end-time-input"]').type('11:00');
    cy.get('[data-testid="location-input"]').type('Virtual');
    cy.get('[data-testid="description-textarea"]').type('Planning for upcoming marketing webinar');
    cy.get('[data-testid="notes-textarea"]').type('Prepare presentation materials');
    
    // Submit the form
    cy.get('[data-testid="save-button"]').click();
    
    // Wait for the create interaction request to complete
    cy.wait('@createInteractionRequest').then((interception) => {
      // Verify the request includes the correct site_id (Marketing = 1)
      expect(interception.request.body.siteId).to.equal(1);
    });
    
    // Verify redirection to the finder page
    cy.url().should('include', '/finder');
    
    // Mock the updated interactions list response to include the new interaction
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 200,
      body: {
        interactions: [
          {
            id: 100,
            title: 'New Marketing Webinar',
            type: 'Meeting',
            lead: 'John Smith',
            startDateTime: '2023-09-15T10:00:00',
            timezone: 'America/New_York',
            endDateTime: '2023-09-15T11:00:00',
            location: 'Virtual',
            description: 'Planning for upcoming marketing webinar',
            notes: 'Prepare presentation materials',
            siteId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        total: 1,
        page: 1,
        pageSize: 25
      }
    }).as('updatedInteractionsRequest');
    
    // Verify the new interaction appears in the table
    cy.get('[data-testid="finder-table"]').should('contain.text', 'New Marketing Webinar');
  });

  it('should direct single-site users straight to Finder', () => {
    // Create a single-site user
    const singleSiteUser = {
      id: 2,
      username: 'singleuser',
      email: 'single@example.com',
      sites: [
        { id: 1, name: 'Marketing', role: 'Editor' }
      ]
    };
    
    // Sample interactions for Marketing site
    const marketingInteractions = [
      {
        id: 1,
        title: 'Marketing Meeting',
        type: 'Meeting',
        lead: 'John Smith',
        startDateTime: '2023-08-15T10:00:00',
        timezone: 'America/New_York',
        endDateTime: '2023-08-15T11:00:00',
        location: 'Conference Room A',
        description: 'Discuss marketing strategy',
        notes: 'Bring marketing materials',
        siteId: 1
      }
    ];
    
    // Stub login response for single-site user
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: singleSiteUser
      }
    }).as('loginRequest');
    
    // Stub sites response
    cy.intercept('GET', '/api/auth/sites', {
      statusCode: 200,
      body: {
        sites: singleSiteUser.sites
      }
    }).as('sitesRequest');
    
    // Stub interactions response
    cy.intercept('GET', '/api/interactions*', {
      statusCode: 200,
      body: {
        interactions: marketingInteractions,
        total: marketingInteractions.length,
        page: 1,
        pageSize: 25
      }
    }).as('interactionsRequest');
    
    // Visit login page
    cy.visit('/login');
    
    // Enter credentials and submit
    cy.get('[data-testid="username-input"]').type('singleuser');
    cy.get('[data-testid="password-input"]').type('password');
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login request to complete
    cy.wait('@loginRequest');
    
    // Verify direct redirection to finder (skipping site selection)
    cy.url().should('include', '/finder');
    cy.url().should('not.include', '/site-selection');
    
    // Verify the user's only site is automatically selected
    cy.get('[data-testid="current-site"]').should('contain.text', 'Marketing');
    
    // Verify interactions are loaded for the Marketing site
    cy.get('[data-testid="finder-table"]').should('contain.text', 'Marketing Meeting');
  });
});