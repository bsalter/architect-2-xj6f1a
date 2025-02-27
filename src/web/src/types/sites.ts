/**
 * TypeScript type definitions for site-related data structures used throughout 
 * the frontend application. This file defines interfaces for sites, site context,
 * and site-related operations to ensure type safety across the application.
 * 
 * @version 1.0.0
 */

import { 
  ApiResponse,
  PaginationMeta,
  PaginationParams,
  SortParams
} from './api';

/**
 * Core site information structure
 */
export interface Site {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Site usage statistics
 */
export interface SiteStatistics {
  totalInteractions: number;
  totalUsers: number;
  activeInteractions: number;
  interactionsByType: Record<string, number>;
  recentActivityCount: number;
}

/**
 * Extended site information with usage statistics
 */
export interface SiteWithStats extends Site {
  statistics: SiteStatistics;
}

/**
 * Possible user roles within a site
 */
export enum SiteUserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

/**
 * User information within a site context
 */
export interface SiteUser {
  id: number;
  username: string;
  email: string;
  role: SiteUserRole;
  assignedAt: string;
}

/**
 * Data structure for site creation and updates
 */
export interface SiteFormData {
  name: string;
  description: string;
  isActive: boolean;
}

/**
 * Structure for associating a user with a site
 */
export interface SiteUserAssociation {
  siteId: number;
  userId: number;
  role: SiteUserRole;
}

/**
 * Structure for the site context provider value
 * Used for maintaining site context across the application
 */
export interface SiteContextType {
  currentSite: Site | null;
  userSites: Site[];
  loading: boolean;
  error: string | null;
  setSite: (siteId: number) => Promise<void>;
}

/**
 * Request structure for setting the active site
 */
export interface SetActiveSiteRequest {
  siteId: number;
}

/**
 * API response for a single site operation
 */
export interface SiteResponse extends ApiResponse {
  success: boolean;
  site: Site;
}

/**
 * API response for a paginated list of sites
 */
export interface SiteListResponse extends ApiResponse {
  sites: Site[];
  pagination: PaginationMeta;
}

/**
 * API response for a paginated list of users in a site
 */
export interface SiteUserListResponse extends ApiResponse {
  users: SiteUser[];
  pagination: PaginationMeta;
}

/**
 * Query parameters for site listing
 */
export interface SiteQueryParams extends PaginationParams, SortParams {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  isActive: boolean;
}

/**
 * Parameters for site searching
 */
export interface SiteSearchParams {
  searchTerm: string;
  page: number;
  pageSize: number;
  isActive: boolean;
}