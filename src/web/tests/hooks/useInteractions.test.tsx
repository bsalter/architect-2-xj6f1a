import React, { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-hooks'; // @testing-library/react-hooks v8.0.1
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // @tanstack/react-query v4.29.5
import { rest } from 'msw'; // msw v1.2.1
import { render, screen, waitFor } from '../utils/render';
import { 
  useInteractions, 
  useInteractionById, 
  useCreateInteraction, 
  useUpdateInteraction, 
  useDeleteInteraction,
  InteractionSortField
} from '../../src/hooks/useInteractions';
import { 
  InteractionType, 
  Interaction, 
  InteractionInput 
} from '../../src/types/interactions';
import { mockInteractions, mockSites } from '../mocks/data';
import { server } from '../mocks/server';

/**
 * Setup function that creates a fresh QueryClient for each test
 * @returns Object containing queryClient and wrapper function
 */
const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return { queryClient, wrapper };
};

/**
 * Helper function to render the useInteractions hook with test wrapper
 * @param initialProps - Optional props to pass to the hook
 * @returns Result of renderHook
 */
const renderInteractionsHook = (initialProps = {}) => {
  const { wrapper } = setup();
  return renderHook(() => useInteractions(), { wrapper });
};

describe('useInteractions hook', () => {
  // Set up MSW server before tests
  beforeAll(() => server.listen());
  
  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
  
  // Close server after all tests
  afterAll(() => server.close());

  describe('useInteractions', () => {
    it('should load interactions with default parameters', async () => {
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      // After loading, we should have interactions
      expect(result.current.isLoading).toBe(false);
      expect(result.current.interactions).toHaveLength(expect.any(Number));
      expect(result.current.totalCount).toBeGreaterThan(0);
    });

    it('should handle loading state correctly', async () => {
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      // Check initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.interactions).toEqual([]);
      
      await waitForNextUpdate();
      
      // After loading completes
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error state correctly', async () => {
      // Mock a server error
      server.use(
        rest.get('/api/v1/interactions', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              status: 'error',
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Server error'
              }
            })
          );
        })
      );
      
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      await waitForNextUpdate();
      
      // Should be in error state
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should apply search filters correctly', async () => {
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      await waitForNextUpdate();
      
      // Apply a title filter
      act(() => {
        result.current.setFilters({ title: 'Client' });
      });
      
      await waitForNextUpdate();
      
      // Should only return interactions with 'Client' in the title
      expect(result.current.interactions.every(interaction => 
        interaction.title.includes('Client')
      )).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      await waitForNextUpdate();
      
      const initialPage = result.current.pagination.page;
      
      // Change page
      act(() => {
        result.current.setPagination(2, result.current.pagination.pageSize);
      });
      
      await waitForNextUpdate();
      
      // Page should have changed
      expect(result.current.pagination.page).toBe(2);
      expect(result.current.pagination.page).not.toBe(initialPage);
    });

    it('should sort interactions correctly', async () => {
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      await waitForNextUpdate();
      
      // Change sort field and direction
      act(() => {
        result.current.setSort(InteractionSortField.TITLE, 'asc');
      });
      
      await waitForNextUpdate();
      
      // Check the sort state
      expect(result.current.sort.field).toBe(InteractionSortField.TITLE);
      expect(result.current.sort.direction).toBe('asc');
    });

    it('should respect site context for all operations', async () => {
      // Mock server to check site context
      let requestedSiteId: number | null = null;
      
      server.use(
        rest.get('/api/v1/interactions', (req, res, ctx) => {
          // Extract site ID from header
          const siteHeader = req.headers.get('X-Site-Context');
          requestedSiteId = siteHeader ? parseInt(siteHeader, 10) : null;
          
          // Filter interactions by site ID
          const filteredInteractions = mockInteractions.filter(
            i => i.siteId === requestedSiteId
          );
          
          return res(
            ctx.status(200),
            ctx.json({
              status: 'success',
              data: {
                interactions: filteredInteractions,
                meta: {
                  pagination: {
                    page: 1,
                    pageSize: 10,
                    totalPages: 1,
                    totalRecords: filteredInteractions.length
                  }
                }
              }
            })
          );
        })
      );
      
      const { result, waitForNextUpdate } = renderInteractionsHook();
      
      await waitForNextUpdate();
      
      // Verify site context was applied
      expect(requestedSiteId).not.toBeNull();
      
      if (requestedSiteId !== null) {
        // All returned interactions should be for the requested site
        expect(result.current.interactions.every(i => i.siteId === requestedSiteId)).toBe(true);
      }
    });
  });

  describe('useInteractionById', () => {
    it('should fetch a single interaction by ID', async () => {
      const { wrapper } = setup();
      const testId = '1'; // Use an ID that exists in mock data
      
      const { result, waitForNextUpdate } = renderHook(
        () => useInteractionById(testId),
        { wrapper }
      );
      
      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      // After loading, we should have the interaction
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.id).toBe(parseInt(testId, 10));
    });

    it('should handle loading state correctly', async () => {
      const { wrapper } = setup();
      const testId = '1';
      
      const { result } = renderHook(
        () => useInteractionById(testId),
        { wrapper }
      );
      
      // Check initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state correctly', async () => {
      // Mock a not found error for this specific interaction
      server.use(
        rest.get('/api/v1/interactions/999', (req, res, ctx) => {
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
      
      const { wrapper } = setup();
      const testId = '999'; // Non-existent ID
      
      const { result, waitForNextUpdate } = renderHook(
        () => useInteractionById(testId),
        { wrapper }
      );
      
      await waitForNextUpdate();
      
      // Should be in error state
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should return null when interaction not found', async () => {
      // Mock a 404 response
      server.use(
        rest.get('/api/v1/interactions/404', (req, res, ctx) => {
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
      
      const { wrapper } = setup();
      const testId = '404';
      
      const { result, waitForNextUpdate } = renderHook(
        () => useInteractionById(testId),
        { wrapper }
      );
      
      await waitForNextUpdate();
      
      // Data should be undefined when not found
      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(true);
    });
  });

  describe('useCreateInteraction', () => {
    it('should create a new interaction successfully', async () => {
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useCreateInteraction(),
        { wrapper }
      );
      
      const newInteraction: InteractionInput = {
        title: 'New Test Interaction',
        type: InteractionType.MEETING,
        lead: 'Test Lead',
        startDateTime: new Date().toISOString(),
        timezone: 'America/New_York',
        endDateTime: new Date().toISOString(),
        location: 'Test Location',
        description: 'Test Description',
        notes: 'Test Notes'
      };
      
      // Execute the mutation
      act(() => {
        result.current.mutate(newInteraction);
      });
      
      await waitForNextUpdate();
      
      // Should have successfully created the interaction
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.title).toBe(newInteraction.title);
    });

    it('should handle validation errors correctly', async () => {
      // Mock a validation error
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
                  { field: 'title', message: 'Title is required' }
                ]
              }
            })
          );
        })
      );
      
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useCreateInteraction(),
        { wrapper }
      );
      
      const invalidInteraction: InteractionInput = {
        title: '', // Empty title should trigger validation error
        type: InteractionType.MEETING,
        lead: 'Test Lead',
        startDateTime: new Date().toISOString(),
        timezone: 'America/New_York',
        endDateTime: new Date().toISOString(),
        location: 'Test Location',
        description: 'Test Description',
        notes: 'Test Notes'
      };
      
      // Execute the mutation
      act(() => {
        result.current.mutate(invalidInteraction);
      });
      
      await waitForNextUpdate();
      
      // Should have failed with validation error
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should add the current site ID to the interaction', async () => {
      // Mock the site context
      const testSiteId = 1;
      let capturedInteraction: any = null;
      
      server.use(
        rest.post('/api/v1/interactions', (req, res, ctx) => {
          // Capture the interaction data
          capturedInteraction = req.body;
          
          return res(
            ctx.status(201),
            ctx.json({
              status: 'success',
              data: {
                interaction: {
                  id: 999,
                  ...capturedInteraction,
                  siteId: testSiteId,
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
      
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useCreateInteraction(),
        { wrapper }
      );
      
      const newInteraction: InteractionInput = {
        title: 'New Test Interaction',
        type: InteractionType.MEETING,
        lead: 'Test Lead',
        startDateTime: new Date().toISOString(),
        timezone: 'America/New_York',
        endDateTime: new Date().toISOString(),
        location: 'Test Location',
        description: 'Test Description',
        notes: 'Test Notes'
      };
      
      // Execute the mutation
      act(() => {
        result.current.mutate(newInteraction);
      });
      
      await waitForNextUpdate();
      
      // The created interaction should have the site ID
      expect(result.current.data?.siteId).toBe(testSiteId);
    });
  });

  describe('useUpdateInteraction', () => {
    it('should update an existing interaction successfully', async () => {
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useUpdateInteraction(),
        { wrapper }
      );
      
      const updateData = {
        id: 1, // Existing interaction ID
        data: {
          title: 'Updated Interaction Title',
          type: InteractionType.MEETING,
          lead: 'Updated Lead',
          startDateTime: new Date().toISOString(),
          timezone: 'America/New_York',
          endDateTime: new Date().toISOString(),
          location: 'Updated Location',
          description: 'Updated Description',
          notes: 'Updated Notes'
        }
      };
      
      // Execute the mutation
      act(() => {
        result.current.mutate(updateData);
      });
      
      await waitForNextUpdate();
      
      // Should have successfully updated the interaction
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.title).toBe(updateData.data.title);
    });

    it('should handle validation errors correctly', async () => {
      // Mock a validation error
      server.use(
        rest.put('/api/v1/interactions/:id', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              status: 'error',
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: [
                  { field: 'title', message: 'Title is required' }
                ]
              }
            })
          );
        })
      );
      
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useUpdateInteraction(),
        { wrapper }
      );
      
      const updateData = {
        id: 1,
        data: {
          title: '', // Empty title should trigger validation error
          type: InteractionType.MEETING,
          lead: 'Updated Lead',
          startDateTime: new Date().toISOString(),
          timezone: 'America/New_York',
          endDateTime: new Date().toISOString(),
          location: 'Updated Location',
          description: 'Updated Description',
          notes: 'Updated Notes'
        }
      };
      
      // Execute the mutation
      act(() => {
        result.current.mutate(updateData);
      });
      
      await waitForNextUpdate();
      
      // Should have failed with validation error
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should maintain the site association during updates', async () => {
      // Mock the site context
      const testSiteId = 1;
      let capturedInteraction: any = null;
      
      server.use(
        rest.put('/api/v1/interactions/:id', (req, res, ctx) => {
          // Capture the interaction data
          capturedInteraction = req.body;
          
          return res(
            ctx.status(200),
            ctx.json({
              status: 'success',
              data: {
                interaction: {
                  id: parseInt(req.params.id as string, 10),
                  ...capturedInteraction,
                  siteId: testSiteId,
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
      
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useUpdateInteraction(),
        { wrapper }
      );
      
      const updateData = {
        id: 1,
        data: {
          title: 'Updated Interaction Title',
          type: InteractionType.MEETING,
          lead: 'Updated Lead',
          startDateTime: new Date().toISOString(),
          timezone: 'America/New_York',
          endDateTime: new Date().toISOString(),
          location: 'Updated Location',
          description: 'Updated Description',
          notes: 'Updated Notes'
        }
      };
      
      // Execute the mutation
      act(() => {
        result.current.mutate(updateData);
      });
      
      await waitForNextUpdate();
      
      // The updated interaction should maintain the site ID
      expect(result.current.data?.siteId).toBe(testSiteId);
    });
  });

  describe('useDeleteInteraction', () => {
    it('should delete an interaction successfully', async () => {
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useDeleteInteraction(),
        { wrapper }
      );
      
      const interactionId = 1; // Existing interaction ID
      
      // Execute the mutation
      act(() => {
        result.current.mutate(interactionId);
      });
      
      await waitForNextUpdate();
      
      // Should have successfully deleted the interaction
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.success).toBe(true);
    });

    it('should handle errors during deletion', async () => {
      // Mock a server error
      server.use(
        rest.delete('/api/v1/interactions/:id', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              status: 'error',
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Error deleting interaction'
              }
            })
          );
        })
      );
      
      const { wrapper } = setup();
      
      const { result, waitForNextUpdate } = renderHook(
        () => useDeleteInteraction(),
        { wrapper }
      );
      
      const interactionId = 1;
      
      // Execute the mutation
      act(() => {
        result.current.mutate(interactionId);
      });
      
      await waitForNextUpdate();
      
      // Should have failed with error
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should only allow deletion within current site context', async () => {
      // Mock the site context check
      const currentSiteId = 1;
      const differentSiteId = 2;
      
      server.use(
        rest.delete('/api/v1/interactions/:id', (req, res, ctx) => {
          const interactionId = parseInt(req.params.id as string, 10);
          const interaction = mockInteractions.find(i => i.id === interactionId);
          
          // If interaction is from a different site, return error
          if (interaction && interaction.siteId !== currentSiteId) {
            return res(
              ctx.status(403),
              ctx.json({
                status: 'error',
                error: {
                  code: 'AUTHORIZATION_ERROR',
                  message: 'You do not have permission to delete this interaction'
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
      );
      
      // Test deleting from current site
      const { wrapper } = setup();
      const { result: result1, waitForNextUpdate: wait1 } = renderHook(
        () => useDeleteInteraction(),
        { wrapper }
      );
      
      // Find an interaction in the current site
      const interactionInCurrentSite = mockInteractions.find(i => i.siteId === currentSiteId)?.id || 1;
      
      // Execute the mutation for current site
      act(() => {
        result1.current.mutate(interactionInCurrentSite);
      });
      
      await wait1();
      
      // Should have successfully deleted the interaction
      expect(result1.current.isSuccess).toBe(true);
      
      // Test deleting from different site
      const { result: result2, waitForNextUpdate: wait2 } = renderHook(
        () => useDeleteInteraction(),
        { wrapper }
      );
      
      // Find an interaction in a different site
      const interactionInDifferentSite = mockInteractions.find(i => i.siteId === differentSiteId)?.id || 8;
      
      // Execute the mutation for different site
      act(() => {
        result2.current.mutate(interactionInDifferentSite);
      });
      
      await wait2();
      
      // Should have failed with authorization error
      expect(result2.current.isError).toBe(true);
    });
  });
});