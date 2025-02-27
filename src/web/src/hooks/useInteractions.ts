/**
 * Custom React hook that provides interaction management functionality
 * using React Query for data fetching, caching, and state management.
 * 
 * This hook handles CRUD operations for interaction records while maintaining
 * site-scoping to ensure users can only access interactions within their authorized sites.
 * 
 * @module hooks/useInteractions
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react'; // react v18.2.0
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query'; // v4.29.5

import { 
  InteractionFilters, 
  InteractionSortField, 
  Interaction, 
  InteractionInput 
} from '../types/interactions';
import { PaginatedResponse, ApiError } from '../types/api';
import { 
  getInteractions, 
  getInteractionById,
  createInteraction, 
  updateInteraction, 
  deleteInteraction 
} from '../api/interactions';
import { useSite } from './useSite';

/**
 * Interface for filter, pagination, and sorting parameters used in the Finder view
 */
interface UseInteractionsFilters {
  filters: InteractionFilters;
  page: number;
  pageSize: number;
  sortField: InteractionSortField;
  sortDirection: 'asc' | 'desc';
}

/**
 * Interface for the return value of the useInteractions hook
 */
interface UseInteractionsResult {
  interactions: Interaction[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  totalCount: number;
  filters: InteractionFilters;
  setFilters: (filters: InteractionFilters) => void;
  sort: {field: InteractionSortField, direction: 'asc' | 'desc'};
  setSort: (field: InteractionSortField, direction: 'asc' | 'desc') => void;
  pagination: {page: number, pageSize: number};
  setPagination: (page: number, pageSize: number) => void;
  refetch: () => Promise<void>;
}

/**
 * Main hook that provides interaction management functionality for the Finder view.
 * Handles fetching, filtering, sorting, and pagination of interaction records.
 * 
 * @returns {UseInteractionsResult} Object containing interaction data and management functions
 */
export const useInteractions = (): UseInteractionsResult => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();
  
  // Get current site context from useSite hook
  const { currentSite } = useSite();
  
  // Set up state for filters, pagination, and sorting
  const [filters, setFilters] = useState<InteractionFilters>({});
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortField, setSortField] = useState<InteractionSortField>(InteractionSortField.START_DATE);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Function to set sorting parameters
  const setSort = useCallback((field: InteractionSortField, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  }, []);
  
  // Function to set pagination parameters
  const setPagination = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  }, []);
  
  // Create the query key with all parameters to ensure proper cache management
  const queryKey = ['interactions', currentSite?.id, filters, page, pageSize, sortField, sortDirection];
  
  // Use React Query to fetch interactions
  const { 
    data,
    isLoading,
    isError,
    error,
    refetch: refetchQuery
  } = useQuery<PaginatedResponse<Interaction>, ApiError>(
    queryKey,
    async () => {
      // Ensure we have a site context before fetching
      if (!currentSite?.id) {
        throw new Error('Site context is required to fetch interactions');
      }
      
      // Prepare search parameters
      const searchParams = {
        filters,
        page,
        pageSize,
        sortField,
        sortDirection,
        // Site context is automatically applied in the API through headers
      };
      
      // Call the API function to get interactions
      const response = await getInteractions(searchParams);
      
      if (response.status !== 'success' || !response.data) {
        throw new Error('Failed to fetch interactions');
      }
      
      return response.data;
    },
    {
      // Only run query if we have a site context
      enabled: !!currentSite?.id,
      // Keep previous data while fetching to prevent UI flickering
      keepPreviousData: true,
      // Stale time to prevent too frequent refetching
      staleTime: 30000, // 30 seconds
      // Error handling
      onError: (err) => {
        console.error('Error fetching interactions:', err);
      }
    }
  );
  
  // Wrapper for refetch to use with async/await
  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);
  
  // Extract interactions and pagination data from the query result
  const interactions = data?.data || [];
  const totalCount = data?.meta?.pagination?.totalRecords || 0;
  
  // Return hook result with all the necessary data and functions
  return {
    interactions,
    isLoading,
    isError,
    error: isError ? error : null,
    totalCount,
    filters,
    setFilters,
    sort: { field: sortField, direction: sortDirection },
    setSort,
    pagination: { page, pageSize },
    setPagination,
    refetch
  };
};

/**
 * Hook to fetch a single interaction by ID.
 * Ensures that the requested interaction belongs to the user's current site.
 * 
 * @param {string} interactionId - The ID of the interaction to fetch
 * @param {UseQueryOptions} options - Optional configuration for the query
 * @returns Query result containing the interaction data
 */
export const useInteractionById = (
  interactionId: string,
  options?: UseQueryOptions<Interaction, ApiError>
) => {
  // Get current site context
  const { currentSite } = useSite();
  
  // Use React Query to fetch the specific interaction
  return useQuery<Interaction, ApiError>(
    ['interaction', interactionId, currentSite?.id],
    async () => {
      // Ensure we have a site context before fetching
      if (!currentSite?.id) {
        throw new Error('Site context is required to fetch interaction');
      }
      
      // Call the API function to get the interaction
      const response = await getInteractionById(Number(interactionId));
      
      if (response.status !== 'success' || !response.data?.interaction) {
        throw new Error('Failed to fetch interaction');
      }
      
      // Verify that the interaction belongs to the current site (additional safety check)
      if (response.data.interaction.siteId !== currentSite.id) {
        throw new Error('You do not have permission to access this interaction');
      }
      
      return response.data.interaction;
    },
    {
      // Only run query if we have both an ID and a site context
      enabled: !!interactionId && !!currentSite?.id,
      // Apply any custom options
      ...options,
      // Error handling
      onError: (err) => {
        console.error(`Error fetching interaction ${interactionId}:`, err);
        if (options?.onError) {
          options.onError(err);
        }
      }
    }
  );
};

/**
 * Hook to create a new interaction.
 * Automatically associates the interaction with the user's current site context.
 * 
 * @param {UseMutationOptions} options - Optional configuration for the mutation
 * @returns Mutation result with create function
 */
export const useCreateInteraction = (
  options?: UseMutationOptions<Interaction, ApiError, InteractionInput>
) => {
  // Get React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Get current site context
  const { currentSite } = useSite();
  
  // Use React Query's mutation hook
  return useMutation<Interaction, ApiError, InteractionInput>(
    async (interactionData) => {
      // Ensure we have a site context before creating
      if (!currentSite?.id) {
        throw new Error('Site context is required to create interaction');
      }
      
      // Call the API function to create the interaction
      // Site context is automatically applied in the API
      const response = await createInteraction(interactionData);
      
      if (response.status !== 'success' || !response.data?.interaction) {
        throw new Error('Failed to create interaction');
      }
      
      return response.data.interaction;
    },
    {
      // Invalidate relevant queries when a new interaction is created
      onSuccess: (data) => {
        // Invalidate the interactions list to reflect the new addition
        queryClient.invalidateQueries(['interactions', currentSite?.id]);
        
        // Call the custom onSuccess handler if provided
        if (options?.onSuccess) {
          options.onSuccess(data, {} as InteractionInput, undefined);
        }
      },
      // Apply any custom options
      ...options,
      // Error handling
      onError: (err) => {
        console.error('Error creating interaction:', err);
        if (options?.onError) {
          options.onError(err, {} as InteractionInput, undefined);
        }
      }
    }
  );
};

/**
 * Hook to update an existing interaction.
 * Maintains site association during update and ensures proper authorization.
 * 
 * @param {UseMutationOptions} options - Optional configuration for the mutation
 * @returns Mutation result with update function
 */
export const useUpdateInteraction = (
  options?: UseMutationOptions<Interaction, ApiError, { id: number; data: InteractionInput }>
) => {
  // Get React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Get current site context
  const { currentSite } = useSite();
  
  // Use React Query's mutation hook
  return useMutation<
    Interaction,
    ApiError,
    { id: number; data: InteractionInput }
  >(
    async ({ id, data }) => {
      // Ensure we have a site context before updating
      if (!currentSite?.id) {
        throw new Error('Site context is required to update interaction');
      }
      
      // Call the API function to update the interaction
      const response = await updateInteraction(id, data);
      
      if (response.status !== 'success' || !response.data?.interaction) {
        throw new Error('Failed to update interaction');
      }
      
      // Verify that the updated interaction belongs to the current site
      if (response.data.interaction.siteId !== currentSite.id) {
        throw new Error('You do not have permission to modify this interaction');
      }
      
      return response.data.interaction;
    },
    {
      // Invalidate relevant queries when an interaction is updated
      onSuccess: (data, variables) => {
        // Invalidate the interactions list
        queryClient.invalidateQueries(['interactions', currentSite?.id]);
        
        // Invalidate the specific interaction query
        queryClient.invalidateQueries(['interaction', String(variables.id), currentSite?.id]);
        
        // Call the custom onSuccess handler if provided
        if (options?.onSuccess) {
          options.onSuccess(data, variables, undefined);
        }
      },
      // Apply any custom options
      ...options,
      // Error handling
      onError: (err, variables) => {
        console.error(`Error updating interaction ${variables.id}:`, err);
        if (options?.onError) {
          options.onError(err, variables, undefined);
        }
      }
    }
  );
};

/**
 * Hook to delete an interaction.
 * Verifies site-scoping authorization before deletion.
 * 
 * @param {UseMutationOptions} options - Optional configuration for the mutation
 * @returns Mutation result with delete function
 */
export const useDeleteInteraction = (
  options?: UseMutationOptions<{ success: boolean }, ApiError, number>
) => {
  // Get React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Get current site context
  const { currentSite } = useSite();
  
  // Use React Query's mutation hook
  return useMutation<{ success: boolean }, ApiError, number>(
    async (interactionId) => {
      // Ensure we have a site context before deleting
      if (!currentSite?.id) {
        throw new Error('Site context is required to delete interaction');
      }
      
      // Call the API function to delete the interaction
      // Site-scoping is verified in the API layer
      const response = await deleteInteraction(interactionId);
      
      if (response.status !== 'success' || !response.data?.success) {
        throw new Error('Failed to delete interaction');
      }
      
      return response.data;
    },
    {
      // Invalidate relevant queries when an interaction is deleted
      onSuccess: (_, interactionId) => {
        // Invalidate the interactions list
        queryClient.invalidateQueries(['interactions', currentSite?.id]);
        
        // Invalidate the specific interaction query
        queryClient.invalidateQueries(['interaction', String(interactionId), currentSite?.id]);
        
        // Call the custom onSuccess handler if provided
        if (options?.onSuccess) {
          options.onSuccess({ success: true }, interactionId, undefined);
        }
      },
      // Apply any custom options
      ...options,
      // Error handling
      onError: (err, interactionId) => {
        console.error(`Error deleting interaction ${interactionId}:`, err);
        if (options?.onError) {
          options.onError(err, interactionId, undefined);
        }
      }
    }
  );
};

export { InteractionSortField };