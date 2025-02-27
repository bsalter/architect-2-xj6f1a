/**
 * API client module for interacting with site-related endpoints, providing
 * functions to fetch sites, get site details, and manage site context within the application.
 * 
 * @module api/sites
 * @version 1.0.0
 */

import { get, post, buildQueryString } from './client';
import {
  Site,
  SiteListResponse,
  SiteResponse,
  SiteQueryParams,
  SiteSearchParams,
  SiteUserListResponse,
  SetActiveSiteRequest
} from '../types/sites';

/**
 * Fetches all sites the current user has access to
 * 
 * @param params - Optional query parameters for pagination and filtering
 * @returns Promise resolving to list of sites with pagination
 */
export async function getSites(params?: SiteQueryParams): Promise<SiteListResponse> {
  const queryString = params ? buildQueryString(params) : '';
  return get<SiteListResponse>(`/api/sites${queryString}`);
}

/**
 * Searches for sites based on provided search parameters
 * 
 * @param params - Search parameters including search term and pagination
 * @returns Promise resolving to list of sites matching search criteria
 */
export async function searchSites(params: SiteSearchParams): Promise<SiteListResponse> {
  const queryString = buildQueryString(params);
  return get<SiteListResponse>(`/api/sites/search${queryString}`);
}

/**
 * Fetches details for a specific site by ID
 * 
 * @param siteId - ID of the site to fetch
 * @returns Promise resolving to site details
 */
export async function getSite(siteId: number): Promise<SiteResponse> {
  return get<SiteResponse>(`/api/sites/${siteId}`);
}

/**
 * Fetches users associated with a specific site
 * 
 * @param siteId - ID of the site to fetch users for
 * @param params - Optional query parameters for pagination and filtering
 * @returns Promise resolving to list of users with pagination
 */
export async function getSiteUsers(
  siteId: number,
  params?: SiteQueryParams
): Promise<SiteUserListResponse> {
  const queryString = params ? buildQueryString(params) : '';
  return get<SiteUserListResponse>(`/api/sites/${siteId}/users${queryString}`);
}

/**
 * Sets the active site context for the current user session
 * 
 * @param siteId - ID of the site to set as active
 * @returns Promise resolving to success status and updated site context
 */
export async function setActiveSite(
  siteId: number
): Promise<{ success: boolean; currentSite: Site }> {
  const payload: SetActiveSiteRequest = { siteId };
  return post<{ success: boolean; currentSite: Site }>('/api/auth/site', payload);
}