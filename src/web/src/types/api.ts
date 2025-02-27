/**
 * TypeScript type definitions for API requests and responses.
 * Defines common structures like pagination, error responses, and endpoint-specific types
 * used throughout the application when interacting with the backend API.
 */

/**
 * Generic interface for all API responses
 * Parameterized with the type of data returned
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  meta?: Record<string, any>;
  error?: ApiError;
}

/**
 * Interface for successful API responses
 * Parameterized with the type of data returned
 */
export interface SuccessResponse<T = any> {
  status: 'success';
  data: T;
  meta?: Record<string, any>;
}

/**
 * Interface for error API responses
 */
export interface ErrorResponse {
  status: 'error';
  error: ApiError;
}

/**
 * Interface for API error details
 */
export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

/**
 * Interface for validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Interface for pagination metadata in API responses
 */
export interface PaginationMeta {
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

/**
 * Interface for paginated API responses
 * Parameterized with the type of data items returned
 */
export interface PaginatedResponse<T = any> {
  status: 'success';
  data: T[];
  meta: PaginationMeta;
}

/**
 * Interface for common query parameters used in GET requests
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Enum of possible API error codes returned by the backend
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Interface for login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Interface for login response data
 */
export interface LoginResponse {
  token: string;
  user: UserDetails;
}

/**
 * Interface for user details returned by the API
 */
export interface UserDetails {
  id: number;
  username: string;
  email: string;
  sites: SiteInfo[];
}

/**
 * Interface for site information associated with a user
 */
export interface SiteInfo {
  id: number;
  name: string;
  role: string;
}

/**
 * Interface for the request to set the active site context
 */
export interface SetSiteContextRequest {
  siteId: number;
}

/**
 * Interface for the response when setting the active site context
 */
export interface SetSiteContextResponse {
  success: boolean;
  currentSite: SiteInfo;
}

/**
 * Interface for interaction-specific filter parameters
 */
export interface InteractionFilters {
  title?: string;
  type?: string;
  lead?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

/**
 * Interface for query parameters specific to interaction endpoints,
 * extending common query parameters
 */
export interface InteractionQueryParams extends QueryParams {
  filters?: InteractionFilters;
}

/**
 * Enum of HTTP methods used in API requests
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

/**
 * Interface for configuring API requests
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  withCredentials?: boolean;
  responseType?: string;
  timeout?: number;
}