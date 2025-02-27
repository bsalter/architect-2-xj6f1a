/**
 * Core API client module that provides HTTP request functions for communicating with the backend REST API.
 * Handles request configuration, authentication, error handling, and response parsing.
 * 
 * @module api/client
 */

import axios, { AxiosInstance, AxiosError } from 'axios'; // axios v1.4.0
import { 
  API_BASE_URL, 
  API_VERSION, 
  REQUEST_TIMEOUT 
} from '../utils/constants';
import { 
  getToken, 
  getSiteContext 
} from '../utils/storage';
import { 
  ApiResponse, 
  ErrorResponse, 
  HttpMethod, 
  RequestConfig 
} from '../types/api';

// Create a configured instance of axios
const apiInstance = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: REQUEST_TIMEOUT
});

/**
 * Configures request and response interceptors for the API client
 */
function setupInterceptors(): void {
  // Request interceptor to add auth token and site context
  apiInstance.interceptors.request.use(
    (config) => {
      const token = getToken();
      const siteContext = getSiteContext();
      
      // Add authorization header if token exists
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add site context header if available
      if (siteContext) {
        config.headers['X-Site-Context'] = siteContext.toString();
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Response interceptor to standardize error handling
  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => handleApiError(error)
  );
}

// Initialize interceptors
setupInterceptors();

/**
 * Processes API errors into a standardized format
 * @param error - The error from axios
 * @returns A rejected promise with standardized error
 */
async function handleApiError(error: AxiosError): Promise<never> {
  let errorResponse: ErrorResponse = {
    status: 'error',
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred'
    }
  };
  
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    const responseData = error.response.data as any;
    
    // Use the error from the response if available
    if (responseData && responseData.error) {
      errorResponse.error = responseData.error;
    } else {
      // Create a standard error based on status code
      const statusCode = error.response.status;
      
      switch(statusCode) {
        case 400:
          errorResponse.error = {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data'
          };
          break;
        case 401:
          errorResponse.error = {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication required'
          };
          break;
        case 403:
          errorResponse.error = {
            code: 'AUTHORIZATION_ERROR',
            message: 'You do not have permission to access this resource'
          };
          break;
        case 404:
          errorResponse.error = {
            code: 'RESOURCE_NOT_FOUND',
            message: 'The requested resource was not found'
          };
          break;
        case 500:
          errorResponse.error = {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected server error occurred'
          };
          break;
        default:
          errorResponse.error = {
            code: `HTTP_ERROR_${statusCode}`,
            message: `HTTP error ${statusCode}`
          };
      }
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorResponse.error = {
      code: 'NETWORK_ERROR',
      message: 'Network error - no response received from server'
    };
  } else {
    // Something happened in setting up the request
    errorResponse.error = {
      code: 'REQUEST_SETUP_ERROR',
      message: error.message || 'Error setting up the request'
    };
  }
  
  return Promise.reject(errorResponse);
}

/**
 * Generic request function that forms the basis of all API calls
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param url - API endpoint URL
 * @param data - Optional request payload
 * @param config - Optional request configuration
 * @returns Promise resolving to API response
 */
export async function request<T = any>(
  method: HttpMethod,
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  try {
    // Prepare the request configuration
    const requestConfig = {
      ...config,
      method,
      url,
      data: method !== HttpMethod.GET ? data : undefined,
      params: method === HttpMethod.GET && config?.params ? config.params : undefined
    };
    
    // Make the request
    const response = await apiInstance(requestConfig);
    
    // Return a standardized successful response
    return {
      status: 'success',
      data: response.data.data || response.data,
      meta: response.data.meta
    };
  } catch (error) {
    // Error handling is done in the interceptor, but we handle any others here
    if ((error as ErrorResponse).status === 'error') {
      throw error;
    }
    
    return handleApiError(error as AxiosError);
  }
}

/**
 * Performs a GET request to the specified endpoint
 * @param url - API endpoint URL
 * @param config - Optional request configuration
 * @returns Promise resolving to API response
 */
export async function get<T = any>(
  url: string,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(HttpMethod.GET, url, null, config);
}

/**
 * Performs a POST request to the specified endpoint
 * @param url - API endpoint URL
 * @param data - Request payload
 * @param config - Optional request configuration
 * @returns Promise resolving to API response
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(HttpMethod.POST, url, data, config);
}

/**
 * Performs a PUT request to the specified endpoint
 * @param url - API endpoint URL
 * @param data - Request payload
 * @param config - Optional request configuration
 * @returns Promise resolving to API response
 */
export async function put<T = any>(
  url: string,
  data: any,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(HttpMethod.PUT, url, data, config);
}

/**
 * Performs a DELETE request to the specified endpoint
 * @param url - API endpoint URL
 * @param config - Optional request configuration
 * @returns Promise resolving to API response
 */
export async function del<T = any>(
  url: string,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(HttpMethod.DELETE, url, null, config);
}

/**
 * Builds a URL query string from an object of parameters
 * @param params - Object containing query parameters
 * @returns Formatted query string with leading '?' if parameters exist
 */
export function buildQueryString(params: Record<string, any>): string {
  // Filter out null or undefined values
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  
  // Return empty string if no valid parameters
  if (Object.keys(filteredParams).length === 0) {
    return '';
  }
  
  // Build the query string
  const queryString = Object.entries(filteredParams)
    .map(([key, value]) => {
      // Handle arrays and objects by JSON stringifying them
      const paramValue = typeof value === 'object' 
        ? encodeURIComponent(JSON.stringify(value))
        : encodeURIComponent(String(value));
      
      return `${encodeURIComponent(key)}=${paramValue}`;
    })
    .join('&');
    
  return `?${queryString}`;
}

/**
 * Class that encapsulates API client functionality
 * Provides an object-oriented approach to making API requests
 */
export class ApiClient {
  /**
   * The axios instance used for making HTTP requests
   */
  public instance: AxiosInstance;
  
  /**
   * Creates a new API client with configured axios instance
   */
  constructor() {
    // Create axios instance
    this.instance = axios.create({
      baseURL: `${API_BASE_URL}/${API_VERSION}`,
      timeout: REQUEST_TIMEOUT
    });
    
    // Set up interceptors
    this.setupInterceptors();
  }
  
  /**
   * Configures request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        const token = getToken();
        const siteContext = getSiteContext();
        
        // Add authorization header if token exists
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add site context header if available
        if (siteContext) {
          config.headers['X-Site-Context'] = siteContext.toString();
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }
  
  /**
   * Processes API errors into a standardized format
   * @param error - The error from axios
   * @returns Standardized error response
   */
  private handleError(error: AxiosError): ErrorResponse {
    let errorResponse: ErrorResponse = {
      status: 'error',
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred'
      }
    };
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      const responseData = error.response.data as any;
      
      // Use the error from the response if available
      if (responseData && responseData.error) {
        errorResponse.error = responseData.error;
      } else {
        // Create a standard error based on status code
        const statusCode = error.response.status;
        
        switch(statusCode) {
          case 400:
            errorResponse.error = {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            };
            break;
          case 401:
            errorResponse.error = {
              code: 'AUTHENTICATION_ERROR',
              message: 'Authentication required'
            };
            break;
          case 403:
            errorResponse.error = {
              code: 'AUTHORIZATION_ERROR',
              message: 'You do not have permission to access this resource'
            };
            break;
          case 404:
            errorResponse.error = {
              code: 'RESOURCE_NOT_FOUND',
              message: 'The requested resource was not found'
            };
            break;
          case 500:
            errorResponse.error = {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected server error occurred'
            };
            break;
          default:
            errorResponse.error = {
              code: `HTTP_ERROR_${statusCode}`,
              message: `HTTP error ${statusCode}`
            };
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse.error = {
        code: 'NETWORK_ERROR',
        message: 'Network error - no response received from server'
      };
    } else {
      // Something happened in setting up the request
      errorResponse.error = {
        code: 'REQUEST_SETUP_ERROR',
        message: error.message || 'Error setting up the request'
      };
    }
    
    return errorResponse;
  }
  
  /**
   * Generic request method
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param url - API endpoint URL
   * @param data - Optional request payload
   * @param config - Optional request configuration
   * @returns Promise resolving to API response
   */
  public async request<T = any>(
    method: HttpMethod,
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      // Prepare the request configuration
      const requestConfig = {
        ...config,
        method,
        url,
        data: method !== HttpMethod.GET ? data : undefined,
        params: method === HttpMethod.GET && config?.params ? config.params : undefined
      };
      
      // Make the request
      const response = await this.instance(requestConfig);
      
      // Return a standardized successful response
      return {
        status: 'success',
        data: response.data.data || response.data,
        meta: response.data.meta
      };
    } catch (error) {
      // Error is already handled in the interceptor
      throw error;
    }
  }
  
  /**
   * GET request method
   * @param url - API endpoint URL
   * @param config - Optional request configuration
   * @returns Promise resolving to API response
   */
  public async get<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.GET, url, null, config);
  }
  
  /**
   * POST request method
   * @param url - API endpoint URL
   * @param data - Request payload
   * @param config - Optional request configuration
   * @returns Promise resolving to API response
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.POST, url, data, config);
  }
  
  /**
   * PUT request method
   * @param url - API endpoint URL
   * @param data - Request payload
   * @param config - Optional request configuration
   * @returns Promise resolving to API response
   */
  public async put<T = any>(
    url: string,
    data: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.PUT, url, data, config);
  }
  
  /**
   * DELETE request method
   * @param url - API endpoint URL
   * @param config - Optional request configuration
   * @returns Promise resolving to API response
   */
  public async delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(HttpMethod.DELETE, url, null, config);
  }
}