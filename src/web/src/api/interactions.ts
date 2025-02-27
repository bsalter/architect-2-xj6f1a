/**
 * API client module for Interaction-related operations.
 * Provides functions to fetch, create, update, and delete interaction records through the backend API.
 * Includes support for searching, filtering, and pagination within the site context.
 * 
 * @module api/interactions
 * @version 1.0.0
 */

import { get, post, put, del } from './client';
import { 
  Interaction,
  InteractionFormData,
  InteractionSearchParams,
  InteractionListResponse,
  InteractionResponse,
  InteractionStats
} from '../types/interactions';
import { ApiResponse } from '../types/api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Fetches a paginated list of interactions with support for searching, filtering, sorting and pagination.
 * Results are automatically filtered based on the user's site context.
 * 
 * @param params - Search parameters including filters, pagination, and sorting options
 * @returns A promise that resolves to a paginated list of interactions
 */
export async function getInteractions(
  params: InteractionSearchParams
): Promise<ApiResponse<InteractionListResponse>> {
  // Convert search parameters to query format
  const queryParams: Record<string, any> = {
    page: params.page || 1,
    pageSize: params.pageSize || 25
  };
  
  // Add optional search parameters if present
  if (params.search) {
    queryParams.search = params.search;
  }
  
  // Add sorting parameters if present
  if (params.sortField) {
    queryParams.sortField = params.sortField;
    queryParams.sortDirection = params.sortDirection || 'asc';
  }
  
  // Add filters if present
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[`filter_${key}`] = value;
      }
    });
  }
  
  // Make the API request
  return get<InteractionListResponse>(API_ENDPOINTS.INTERACTIONS.BASE, {
    params: queryParams
  });
}

/**
 * Fetches a single interaction by its ID.
 * The user must have access to the site that owns the interaction.
 * 
 * @param id - The ID of the interaction to fetch
 * @returns A promise that resolves to the requested interaction
 */
export async function getInteraction(id: number): Promise<ApiResponse<InteractionResponse>> {
  return get<InteractionResponse>(API_ENDPOINTS.INTERACTIONS.DETAILS(id));
}

/**
 * Creates a new interaction record.
 * The interaction will be associated with the user's current site context.
 * 
 * @param data - The interaction data to create
 * @returns A promise that resolves to the newly created interaction
 */
export async function createInteraction(
  data: InteractionFormData
): Promise<ApiResponse<InteractionResponse>> {
  return post<InteractionResponse>(API_ENDPOINTS.INTERACTIONS.BASE, data);
}

/**
 * Updates an existing interaction record.
 * The user must have access to the site that owns the interaction.
 * 
 * @param id - The ID of the interaction to update
 * @param data - The updated interaction data
 * @returns A promise that resolves to the updated interaction
 */
export async function updateInteraction(
  id: number, 
  data: InteractionFormData
): Promise<ApiResponse<InteractionResponse>> {
  return put<InteractionResponse>(API_ENDPOINTS.INTERACTIONS.DETAILS(id), data);
}

/**
 * Deletes an interaction record.
 * The user must have access to the site that owns the interaction.
 * 
 * @param id - The ID of the interaction to delete
 * @returns A promise that resolves to a success indicator
 */
export async function deleteInteraction(
  id: number
): Promise<ApiResponse<{success: boolean}>> {
  return del<{success: boolean}>(API_ENDPOINTS.INTERACTIONS.DETAILS(id));
}

/**
 * Fetches statistics about interactions for the current site context.
 * Includes counts by type, by month, and by lead.
 * 
 * @returns A promise that resolves to interaction statistics
 */
export async function getInteractionStats(): Promise<ApiResponse<InteractionStats>> {
  return get<InteractionStats>(`${API_ENDPOINTS.INTERACTIONS.BASE}/stats`);
}

/**
 * Advanced search function for interactions with complex filtering.
 * Allows more detailed search criteria than the standard getInteractions function.
 * Results are automatically filtered based on the user's site context.
 * 
 * @param searchParams - Advanced search criteria
 * @returns A promise that resolves to a paginated list of matching interactions
 */
export async function searchInteractions(
  searchParams: InteractionSearchParams
): Promise<ApiResponse<InteractionListResponse>> {
  // Convert search parameters to query format
  const queryParams: Record<string, any> = {
    page: searchParams.page || 1,
    pageSize: searchParams.pageSize || 25
  };
  
  // Add search term if present
  if (searchParams.search) {
    queryParams.search = searchParams.search;
  }
  
  // Add sorting parameters if present
  if (searchParams.sortField) {
    queryParams.sortField = searchParams.sortField;
    queryParams.sortDirection = searchParams.sortDirection || 'asc';
  }
  
  // Add filters if present
  if (searchParams.filters) {
    // Convert filters object to a string to be parsed by the backend
    queryParams.filters = JSON.stringify(searchParams.filters);
  }
  
  // Make the API request to the search endpoint
  return get<InteractionListResponse>(`${API_ENDPOINTS.INTERACTIONS.BASE}/search`, {
    params: queryParams
  });
}