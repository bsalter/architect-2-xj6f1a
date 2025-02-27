import { 
  describe, 
  it, 
  expect, 
  beforeAll, 
  afterAll, 
  beforeEach 
} from 'vitest';
import { rest } from 'msw';
import { 
  getInteractions, 
  getInteraction, 
  createInteraction, 
  updateInteraction, 
  deleteInteraction 
} from '../../src/api/interactions';
import { 
  Interaction, 
  InteractionFormData,
  InteractionType 
} from '../../src/types/interactions';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '../../src/types/api';
import { server } from '../mocks/server';
import { mockInteractions, mockInteraction } from '../mocks/data';

/**
 * Set up the mock server before all tests
 */
beforeAll(() => {
  server.listen();
});

/**
 * Clean up the mock server after all tests
 */
afterAll(() => {
  server.close();
});

/**
 * Reset mock handlers before each test
 */
beforeEach(() => {
  server.resetHandlers();
});

describe('Interactions API', () => {
  /**
   * Tests fetching a paginated list of interactions
   */
  it('should fetch a paginated list of interactions', async () => {
    // Mock the API response
    server.use(
      rest.get('/api/v1/interactions', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              interactions: mockInteractions.slice(0, 5),
              meta: {
                pagination: {
                  page: 1,
                  pageSize: 25,
                  totalPages: 1,
                  totalRecords: 5
                }
              }
            }
          })
        );
      })
    );

    const response = await getInteractions({ page: 1, pageSize: 25 });
    
    expect(response.status).toBe('success');
    expect(response.data.interactions).toBeDefined();
    expect(Array.isArray(response.data.interactions)).toBe(true);
    expect(response.data.interactions.length).toBe(5);
    expect(response.data.meta.pagination).toBeDefined();
    expect(response.data.meta.pagination.page).toBe(1);
    expect(response.data.meta.pagination.pageSize).toBe(25);
    expect(response.data.meta.pagination.totalRecords).toBe(5);
  });

  /**
   * Tests fetching interactions with search parameters
   */
  it('should fetch interactions with search parameters', async () => {
    const searchTerm = 'Meeting';
    
    // Mock the API response with filtered data
    server.use(
      rest.get('/api/v1/interactions', (req, res, ctx) => {
        // Verify search params were passed correctly
        const querySearch = req.url.searchParams.get('search');
        const queryType = req.url.searchParams.get('filter_type');
        
        expect(querySearch).toBe(searchTerm);
        expect(queryType).toBe('MEETING');
        
        // Return filtered interactions
        const filteredInteractions = mockInteractions.filter(
          interaction => interaction.type === InteractionType.MEETING
        ).slice(0, 3);
        
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              interactions: filteredInteractions,
              meta: {
                pagination: {
                  page: 1,
                  pageSize: 25,
                  totalPages: 1,
                  totalRecords: 3
                }
              }
            }
          })
        );
      })
    );

    const response = await getInteractions({ 
      search: searchTerm, 
      page: 1, 
      pageSize: 25,
      filters: { type: InteractionType.MEETING }
    });
    
    expect(response.status).toBe('success');
    expect(response.data.interactions).toBeDefined();
    expect(Array.isArray(response.data.interactions)).toBe(true);
    response.data.interactions.forEach(interaction => {
      expect(interaction.type).toBe(InteractionType.MEETING);
    });
  });

  /**
   * Tests fetching a single interaction by ID
   */
  it('should fetch a single interaction by ID', async () => {
    const interactionId = 1;
    const mockSingleInteraction = {...mockInteractions[0], id: interactionId};
    
    // Mock the API response for a single interaction
    server.use(
      rest.get(`/api/v1/interactions/${interactionId}`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              interaction: mockSingleInteraction
            }
          })
        );
      })
    );

    const response = await getInteraction(interactionId);
    
    expect(response.status).toBe('success');
    expect(response.data.interaction).toBeDefined();
    expect(response.data.interaction.id).toBe(interactionId);
    expect(response.data.interaction.title).toBe(mockSingleInteraction.title);
  });

  /**
   * Tests error handling when an interaction is not found
   */
  it('should handle error when an interaction is not found', async () => {
    const nonExistentId = 999;
    
    // Mock a 404 response for a non-existent interaction
    server.use(
      rest.get(`/api/v1/interactions/${nonExistentId}`, (req, res, ctx) => {
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
      })
    );

    try {
      await getInteraction(nonExistentId);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.status).toBe('error');
      expect(error.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.error.message).toBe('Interaction not found');
    }
  });

  /**
   * Tests creating a new interaction
   */
  it('should create a new interaction', async () => {
    const newInteraction: InteractionFormData = {
      title: 'New Test Interaction',
      type: InteractionType.MEETING,
      lead: 'Test Lead',
      startDateTime: '2023-08-15T10:00:00Z',
      timezone: 'America/New_York',
      endDateTime: '2023-08-15T11:00:00Z',
      location: 'Test Location',
      description: 'Test Description',
      notes: 'Test Notes'
    };

    // Track request payload for verification
    let requestBody: any = null;
    
    // Mock the API response for creating an interaction
    server.use(
      rest.post('/api/v1/interactions', async (req, res, ctx) => {
        requestBody = await req.json();
        
        return res(
          ctx.status(201),
          ctx.json({
            status: 'success',
            data: {
              interaction: {
                id: 100,
                ...newInteraction,
                siteId: 1,
                site: null,
                createdBy: 1,
                createdByName: 'admin',
                createdAt: new Date().toISOString(),
                updatedBy: null,
                updatedByName: null,
                updatedAt: null
              }
            }
          })
        );
      })
    );

    const response = await createInteraction(newInteraction);
    
    expect(response.status).toBe('success');
    expect(response.data.interaction).toBeDefined();
    expect(response.data.interaction.id).toBe(100);
    expect(response.data.interaction.title).toBe(newInteraction.title);
    expect(response.data.interaction.type).toBe(newInteraction.type);
    
    // Verify the request payload matches the input data
    expect(requestBody).toEqual(newInteraction);
  });

  /**
   * Tests validation error handling when creating an interaction
   */
  it('should handle validation errors when creating an interaction', async () => {
    const invalidInteraction = {
      // Missing required fields
      title: '',
      type: InteractionType.MEETING,
      // other required fields missing
    } as InteractionFormData;

    // Mock a validation error response
    server.use(
      rest.post('/api/v1/interactions', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { field: 'title', message: 'Title is required' },
                { field: 'lead', message: 'Lead is required' },
                { field: 'startDateTime', message: 'Start date/time is required' }
              ]
            }
          })
        );
      })
    );

    try {
      await createInteraction(invalidInteraction);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.status).toBe('error');
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.details).toHaveLength(3);
      expect(error.error.details[0].field).toBe('title');
      expect(error.error.details[1].field).toBe('lead');
    }
  });

  /**
   * Tests updating an existing interaction
   */
  it('should update an existing interaction', async () => {
    const interactionId = 1;
    const updateData: InteractionFormData = {
      title: 'Updated Test Interaction',
      type: InteractionType.MEETING,
      lead: 'Updated Lead',
      startDateTime: '2023-08-15T10:00:00Z',
      timezone: 'America/New_York',
      endDateTime: '2023-08-15T11:00:00Z',
      location: 'Updated Location',
      description: 'Updated Description',
      notes: 'Updated Notes'
    };

    // Track request payload for verification
    let requestBody: any = null;
    
    // Mock the API response for updating an interaction
    server.use(
      rest.put(`/api/v1/interactions/${interactionId}`, async (req, res, ctx) => {
        requestBody = await req.json();
        
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              interaction: {
                id: interactionId,
                ...updateData,
                siteId: 1,
                site: null,
                createdBy: 1,
                createdByName: 'admin',
                createdAt: '2023-08-01T00:00:00Z',
                updatedBy: 1,
                updatedByName: 'admin',
                updatedAt: new Date().toISOString()
              }
            }
          })
        );
      })
    );

    const response = await updateInteraction(interactionId, updateData);
    
    expect(response.status).toBe('success');
    expect(response.data.interaction).toBeDefined();
    expect(response.data.interaction.id).toBe(interactionId);
    expect(response.data.interaction.title).toBe(updateData.title);
    expect(response.data.interaction.description).toBe(updateData.description);
    
    // Verify the request payload matches the input data
    expect(requestBody).toEqual(updateData);
  });

  /**
   * Tests validation error handling when updating an interaction
   */
  it('should handle validation errors when updating an interaction', async () => {
    const interactionId = 1;
    const invalidUpdate = {
      title: '', // Invalid empty title
      type: InteractionType.MEETING,
      lead: 'Updated Lead',
      startDateTime: 'invalid-date', // Invalid date format
      timezone: 'America/New_York',
      endDateTime: '2023-08-15T11:00:00Z',
      location: 'Updated Location',
      description: 'Updated Description',
      notes: 'Updated Notes'
    } as InteractionFormData;

    // Mock a validation error response
    server.use(
      rest.put(`/api/v1/interactions/${interactionId}`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { field: 'title', message: 'Title is required' },
                { field: 'startDateTime', message: 'Invalid date format' }
              ]
            }
          })
        );
      })
    );

    try {
      await updateInteraction(interactionId, invalidUpdate);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.status).toBe('error');
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.details).toHaveLength(2);
      expect(error.error.details[0].field).toBe('title');
      expect(error.error.details[1].field).toBe('startDateTime');
    }
  });

  /**
   * Tests deleting an interaction
   */
  it('should delete an interaction', async () => {
    const interactionId = 1;

    // Track request URL for verification
    let requestUrl: string | null = null;
    
    // Mock the API response for deleting an interaction
    server.use(
      rest.delete(`/api/v1/interactions/${interactionId}`, (req, res, ctx) => {
        requestUrl = req.url.toString();
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              success: true
            }
          })
        );
      })
    );

    const response = await deleteInteraction(interactionId);
    
    expect(response.status).toBe('success');
    expect(response.data.success).toBe(true);
    
    // Verify the request was sent to the correct endpoint
    expect(requestUrl).toContain(`/interactions/${interactionId}`);
  });

  /**
   * Tests error handling when deleting a non-existent interaction
   */
  it('should handle error when deleting a non-existent interaction', async () => {
    const nonExistentId = 999;

    // Mock a 404 response for a non-existent interaction
    server.use(
      rest.delete(`/api/v1/interactions/${nonExistentId}`, (req, res, ctx) => {
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
      })
    );

    try {
      await deleteInteraction(nonExistentId);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.status).toBe('error');
      expect(error.error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.error.message).toBe('Interaction not found');
    }
  });
});