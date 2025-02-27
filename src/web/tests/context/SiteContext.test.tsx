import React, { useContext } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteContext, SiteProvider } from '../../src/context/SiteContext';
import { mockSites } from '../mocks/data';
import { server } from '../mocks/server';
import { rest } from 'msw';

// Helper component to access and display SiteContext values for testing
const TestComponent = () => {
  const context = useContext(SiteContext);
  
  if (!context) {
    return <div>No context provided</div>;
  }
  
  const { currentSite, userSites, loading, error, setSite } = context;
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not loading'}</div>
      {error && <div data-testid="error-message">{error}</div>}
      
      <div data-testid="sites-count">Sites count: {userSites.length}</div>
      
      {currentSite ? (
        <div data-testid="current-site">
          Current site: {currentSite.name} (ID: {currentSite.id})
        </div>
      ) : (
        <div data-testid="no-current-site">No current site selected</div>
      )}
      
      <div>
        <h3>Available sites:</h3>
        <ul data-testid="sites-list">
          {userSites.map(site => (
            <li key={site.id} data-testid={`site-${site.id}`}>
              {site.name}
              <button 
                onClick={() => setSite(site.id)}
                data-testid={`select-site-${site.id}`}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Mock the useAuth hook
jest.mock('../../src/hooks/useAuth', () => {
  let logoutCallback = null;
  
  return {
    __esModule: true,
    default: () => ({
      user: { id: 1, username: 'testuser' },
      isAuthenticated: true,
      registerLogoutCallback: jest.fn((callback) => {
        logoutCallback = callback;
        return jest.fn(); // Return unregister function
      })
    }),
    // Helper for tests to trigger the logout callback
    __triggerLogout: () => {
      if (logoutCallback) {
        logoutCallback();
      }
    }
  };
});

// Get access to the mock module
const mockedUseAuth = jest.requireMock('../../src/hooks/useAuth');

describe('SiteContext', () => {
  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers();
    
    // Mock localStorage and sessionStorage
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    
    // Default MSW handlers for API requests
    server.use(
      // Get sites endpoint
      rest.get('*/api/sites', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              sites: mockSites
            }
          })
        );
      }),
      
      // Set active site endpoint
      rest.post('*/api/auth/site', (req, res, ctx) => {
        const { siteId } = req.body as { siteId: number };
        const selectedSite = mockSites.find(site => site.id === siteId);
        
        return res(
          ctx.status(200),
          ctx.json({
            success: true,
            currentSite: selectedSite
          })
        );
      })
    );
  });
  
  afterEach(() => {
    // Clean up mocks
    jest.resetAllMocks();
  });
  
  it('should load sites when initialized', async () => {
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Initially shows loading state
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    
    // After loading, shows the sites
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('sites-count')).toHaveTextContent(`Sites count: ${mockSites.length}`);
    });
    
    // Should have first site selected by default
    expect(screen.getByTestId('current-site')).toHaveTextContent(`Current site: ${mockSites[0].name}`);
  });
  
  it('should handle site selection', async () => {
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not loading');
    });
    
    // Select the second site
    const secondSite = mockSites[1];
    fireEvent.click(screen.getByTestId(`select-site-${secondSite.id}`));
    
    // Should update the current site
    await waitFor(() => {
      expect(screen.getByTestId('current-site')).toHaveTextContent(`Current site: ${secondSite.name}`);
    });
    
    // Should store site in storage
    expect(Storage.prototype.setItem).toHaveBeenCalled();
  });
  
  it('should handle API error when loading sites', async () => {
    // Override with error response
    server.use(
      rest.get('*/api/sites', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            error: {
              message: 'Failed to load site data'
            }
          })
        );
      })
    );
    
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to load site data');
    });
  });
  
  it('should handle empty sites response', async () => {
    // Override with empty sites
    server.use(
      rest.get('*/api/sites', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              sites: []
            }
          })
        );
      })
    );
    
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Should show appropriate error
    await waitFor(() => {
      expect(screen.getByTestId('sites-count')).toHaveTextContent('Sites count: 0');
      expect(screen.getByTestId('error-message')).toHaveTextContent('You do not have access to any sites.');
    });
  });
  
  it('should handle API error when changing site', async () => {
    // Override with error response
    server.use(
      rest.post('*/api/auth/site', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            error: {
              message: 'Failed to set site context'
            }
          })
        );
      })
    );
    
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not loading');
    });
    
    // Try to select a site
    fireEvent.click(screen.getByTestId(`select-site-${mockSites[1].id}`));
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to set site context');
    });
  });
  
  it('should load stored site context from storage', async () => {
    // Mock stored site ID
    const storedSiteId = mockSites[2].id;
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'site_context') {
        return storedSiteId.toString();
      }
      return null;
    });
    
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Should load the stored site as current
    await waitFor(() => {
      expect(screen.getByTestId('current-site')).toHaveTextContent(`Current site: ${mockSites[2].name}`);
    });
  });
  
  it('should clear site context on logout', async () => {
    render(
      <SiteProvider>
        <TestComponent />
      </SiteProvider>
    );
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByTestId('current-site')).toBeInTheDocument();
    });
    
    // Trigger the logout callback
    mockedUseAuth.__triggerLogout();
    
    // Should clear the site data
    await waitFor(() => {
      expect(screen.getByTestId('no-current-site')).toBeInTheDocument();
      expect(screen.getByTestId('sites-count')).toHaveTextContent('Sites count: 0');
    });
  });
});