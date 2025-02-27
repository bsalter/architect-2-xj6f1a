/**
 * Mock Service Worker (MSW) request handlers for testing
 * This file defines mock API handlers that intercept network requests during testing
 * and return controlled mock responses, enabling testing without a real backend.
 * 
 * @version 1.0.0
 */

import { rest } from 'msw'; // v1.2.1

// Import mock data
import { 
  mockUsers, 
  mockSites, 
  mockUserSiteAssociations, 
  mockInteractions,
  mockLoginResponse,
  generateMockToken,
  generatePaginatedInteractions
} from './data';

// Import API endpoint constants
import { API_ENDPOINTS } from '../../src/utils/constants';

// Authentication handlers
const authHandlers = [
  // Login handler
  rest.post(API_ENDPOINTS.AUTH.LOGIN, (req, res, ctx) => {
    const { username, password } = req.body as { username: string; password: string };
    
    // Find user with matching credentials
    const user = mockUsers.find(u => u.username === username);
    
    if (!user || password !== 'password') { // Simple password check for testing
      return res(
        ctx.status(401),
        ctx.json({
          status: 'error',
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password'
          }
        })
      );
    }
    
    // Return successful login response with token
    const token = generateMockToken(user.id, user.sites.map(site => site.id));
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          token,
          user,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
        }
      })
    );
  }),
  
  // Logout handler
  rest.post(API_ENDPOINTS.AUTH.LOGOUT, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          message: 'Logged out successfully'
        }
      })
    );
  }),
  
  // Current user info handler
  rest.get(API_ENDPOINTS.AUTH.ME, (req, res, ctx) => {
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          status: 'error',
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid or missing authentication token'
          }
        })
      );
    }
    
    // In a real implementation, we would decode the token
    // For mock purposes, we'll just return the first user
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          user: mockUsers[0]
        }
      })
    );
  }),
  
  // User's sites handler
  rest.get(API_ENDPOINTS.AUTH.SITES, (req, res, ctx) => {
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          status: 'error',
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid or missing authentication token'
          }
        })
      );
    }
    
    // For testing, return the sites for the first user
    const userSites = mockUsers[0].sites;
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          sites: userSites
        }
      })
    );
  }),
  
  // Set active site context
  rest.post(API_ENDPOINTS.AUTH.SITE, (req, res, ctx) => {
    const { siteId } = req.body as { siteId: number };
    
    // Check if site exists
    const site = mockSites.find(s => s.id === siteId);
    
    if (!site) {
      return res(
        ctx.status(404),
        ctx.json({
          status: 'error',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Site not found'
          }
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          success: true,
          currentSite: site
        }
      })
    );
  })
];

// Site handlers
const siteHandlers = [
  // List all sites
  rest.get(API_ENDPOINTS.SITES.BASE, (req, res, ctx) => {
    // Only return active sites by default
    const isActive = req.url.searchParams.get('isActive') !== 'false';
    let filteredSites = isActive 
      ? mockSites.filter(site => site.isActive) 
      : mockSites;
    
    // Handle search term if provided
    const searchTerm = req.url.searchParams.get('search');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredSites = filteredSites.filter(site => 
        site.name.toLowerCase().includes(term) || 
        (site.description && site.description.toLowerCase().includes(term))
      );
    }
    
    // Handle pagination
    const page = parseInt(req.url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10', 10);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedSites = filteredSites.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredSites.length / pageSize);
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          sites: paginatedSites,
          pagination: {
            page,
            pageSize,
            totalPages,
            totalRecords: filteredSites.length
          }
        }
      })
    );
  }),
  
  // Get site details
  rest.get(API_ENDPOINTS.SITES.DETAILS('*'), (req, res, ctx) => {
    // Extract site ID from URL path
    const siteId = parseInt(req.params[0] as string, 10);
    const site = mockSites.find(s => s.id === siteId);
    
    if (!site) {
      return res(
        ctx.status(404),
        ctx.json({
          status: 'error',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Site not found'
          }
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          site
        }
      })
    );
  }),
  
  // Get site users
  rest.get(API_ENDPOINTS.SITES.USERS('*'), (req, res, ctx) => {
    // Extract site ID from URL path
    const siteId = parseInt(req.params[0] as string, 10);
    const site = mockSites.find(s => s.id === siteId);
    
    if (!site) {
      return res(
        ctx.status(404),
        ctx.json({
          status: 'error',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Site not found'
          }
        })
      );
    }
    
    // Find all users associated with this site
    const userAssociations = mockUserSiteAssociations.filter(
      association => association.siteId === siteId
    );
    
    const siteUsers = userAssociations.map(association => {
      const user = mockUsers.find(u => u.id === association.userId);
      return {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        role: association.role,
        assignedAt: '2023-01-01T00:00:00Z' // Mock assignment date
      };
    });
    
    // Handle pagination
    const page = parseInt(req.url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10', 10);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const paginatedUsers = siteUsers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(siteUsers.length / pageSize);
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          users: paginatedUsers,
          pagination: {
            page,
            pageSize,
            totalPages,
            totalRecords: siteUsers.length
          }
        }
      })
    );
  })
];

// Interaction handlers
const interactionHandlers = [
  // List/search interactions
  rest.get(API_ENDPOINTS.INTERACTIONS.BASE, (req, res, ctx) => {
    // Extract query parameters
    const search = req.url.searchParams.get('search') || '';
    const page = parseInt(req.url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10', 10);
    const sortField = req.url.searchParams.get('sortField') || 'startDateTime';
    const sortDirection = req.url.searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
    
    // Extract filter parameters
    const filterTitle = req.url.searchParams.get('title') || '';
    const filterType = req.url.searchParams.get('type') || '';
    const filterLead = req.url.searchParams.get('lead') || '';
    const filterStartDate = req.url.searchParams.get('startDate') || '';
    const filterEndDate = req.url.searchParams.get('endDate') || '';
    const filterLocation = req.url.searchParams.get('location') || '';
    
    // Extract site context
    const siteId = parseInt(req.url.searchParams.get('siteId') || '1', 10);
    
    // Use the helper function to generate paginated results
    const result = generatePaginatedInteractions({
      page,
      pageSize,
      search,
      sortField,
      sortDirection,
      filters: {
        title: filterTitle,
        type: filterType as any,
        lead: filterLead,
        startDate: filterStartDate,
        endDate: filterEndDate,
        location: filterLocation
      },
      siteId
    });
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: result
      })
    );
  }),
  
  // Get interaction details
  rest.get(API_ENDPOINTS.INTERACTIONS.DETAILS('*'), (req, res, ctx) => {
    // Extract interaction ID from URL path
    const interactionId = parseInt(req.params[0] as string, 10);
    const interaction = mockInteractions.find(i => i.id === interactionId);
    
    if (!interaction) {
      return res(
        ctx.status(404),
        ctx.json({
          status: 'error',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Interaction not found'
          }
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          interaction
        }
      })
    );
  }),
  
  // Create interaction
  rest.post(API_ENDPOINTS.INTERACTIONS.BASE, (req, res, ctx) => {
    const interactionData = req.body as any;
    
    // For testing purposes, we'll assign an ID and return the created interaction
    const newInteraction = {
      id: Math.max(...mockInteractions.map(i => i.id), 0) + 1,
      ...interactionData,
      createdBy: 1, // Assume admin user is creating
      createdByName: 'admin',
      createdAt: new Date().toISOString(),
      updatedBy: null,
      updatedByName: null,
      updatedAt: null,
      site: mockSites.find(s => s.id === interactionData.siteId) || null
    };
    
    return res(
      ctx.status(201),
      ctx.json({
        status: 'success',
        data: {
          interaction: newInteraction
        }
      })
    );
  }),
  
  // Update interaction
  rest.put(API_ENDPOINTS.INTERACTIONS.DETAILS('*'), (req, res, ctx) => {
    // Extract interaction ID from URL path
    const interactionId = parseInt(req.params[0] as string, 10);
    const existingInteraction = mockInteractions.find(i => i.id === interactionId);
    
    if (!existingInteraction) {
      return res(
        ctx.status(404),
        ctx.json({
          status: 'error',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Interaction not found'
          }
        })
      );
    }
    
    const interactionData = req.body as any;
    
    // Update the interaction
    const updatedInteraction = {
      ...existingInteraction,
      ...interactionData,
      updatedBy: 1, // Assume admin user is updating
      updatedByName: 'admin',
      updatedAt: new Date().toISOString()
    };
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          interaction: updatedInteraction
        }
      })
    );
  }),
  
  // Delete interaction
  rest.delete(API_ENDPOINTS.INTERACTIONS.DETAILS('*'), (req, res, ctx) => {
    // Extract interaction ID from URL path
    const interactionId = parseInt(req.params[0] as string, 10);
    const existingInteraction = mockInteractions.find(i => i.id === interactionId);
    
    if (!existingInteraction) {
      return res(
        ctx.status(404),
        ctx.json({
          status: 'error',
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Interaction not found'
          }
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        data: {
          success: true,
          message: 'Interaction deleted successfully'
        }
      })
    );
  })
];

// Export all handlers
export const handlers = [
  ...authHandlers,
  ...siteHandlers,
  ...interactionHandlers
];

// Export individual handler groups for selective usage in tests
export { authHandlers, siteHandlers, interactionHandlers };