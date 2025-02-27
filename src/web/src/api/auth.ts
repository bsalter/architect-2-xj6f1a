/**
 * API client module for authentication operations
 * 
 * This module provides a comprehensive set of functions for user authentication, 
 * session management, and site context operations including login, logout, token validation,
 * and site association management.
 * 
 * @module api/auth
 * @version 1.0.0
 */

import jwt_decode from 'jwt-decode'; // jwt-decode v3.1.2
import { get, post } from './client';
import {
  LoginCredentials,
  User,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetForm,
  TokenPayload
} from '../types/auth';
import { Site } from '../types/sites';
import { setToken, removeToken } from '../utils/storage';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Authenticates a user with the provided credentials
 * 
 * Sends login credentials to the authentication endpoint and stores the returned JWT token.
 * The rememberMe flag determines how the token is stored (session vs persistent).
 * 
 * @param {LoginCredentials} credentials - User login credentials (username and password)
 * @param {boolean} [rememberMe=false] - Whether to persist the authentication across sessions
 * @returns {Promise<LoginResponse>} Promise resolving to authentication response with token and user data
 */
export async function login(
  credentials: LoginCredentials,
  rememberMe: boolean = false
): Promise<LoginResponse> {
  try {
    const response = await post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    
    if (response.status === 'success' && response.data) {
      // Store the token in browser storage based on rememberMe preference
      setToken(response.data.token, rememberMe);
      return response.data;
    }
    
    throw new Error('Authentication failed: Invalid response format');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logs out the current user by invalidating their session and removing the token
 * 
 * Sends a logout request to the server and removes the stored authentication token.
 * 
 * @returns {Promise<{ success: boolean }>} Promise resolving to success status
 */
export async function logout(): Promise<{ success: boolean }> {
  try {
    // Attempt to notify the server about logout
    const response = await post<{ success: boolean }>(API_ENDPOINTS.AUTH.LOGOUT);
    
    // Remove the token regardless of server response
    removeToken();
    
    return response.data || { success: true };
  } catch (error) {
    // Still remove the token even if server request fails
    removeToken();
    console.error('Logout error:', error);
    return { success: true };
  }
}

/**
 * Fetches the profile of the currently authenticated user
 * 
 * Makes an authenticated request to retrieve current user's profile information.
 * 
 * @returns {Promise<User>} Promise resolving to the current user's data
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await get<{ user: User }>(API_ENDPOINTS.AUTH.ME);
    
    if (response.status === 'success' && response.data && response.data.user) {
      return response.data.user;
    }
    
    throw new Error('Failed to retrieve user profile: Invalid response format');
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
}

/**
 * Fetches all sites that the current user has access to
 * 
 * Makes an authenticated request to retrieve the sites associated with the current user.
 * 
 * @returns {Promise<Site[]>} Promise resolving to array of user's accessible sites
 */
export async function getUserSites(): Promise<Site[]> {
  try {
    const response = await get<{ sites: Site[] }>(API_ENDPOINTS.AUTH.SITES);
    
    if (response.status === 'success' && response.data && Array.isArray(response.data.sites)) {
      return response.data.sites;
    }
    
    throw new Error('Failed to retrieve user sites: Invalid response format');
  } catch (error) {
    console.error('Get user sites error:', error);
    throw error;
  }
}

/**
 * Sets the active site context for the current user session
 * 
 * Updates the active site for the current user session, which affects
 * what data the user can access based on site-scoping.
 * 
 * @param {number} siteId - The ID of the site to set as active
 * @returns {Promise<{ success: boolean, currentSite: Site }>} Promise resolving to success status and selected site
 */
export async function setSiteContext(
  siteId: number
): Promise<{ success: boolean; currentSite: Site }> {
  try {
    const response = await post<{ success: boolean; currentSite: Site }>(
      API_ENDPOINTS.AUTH.SITE,
      { siteId }
    );
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to set site context: Invalid response format');
  } catch (error) {
    console.error('Set site context error:', error);
    throw error;
  }
}

/**
 * Validates the current JWT token and ensures it's not expired
 * 
 * Makes a request to the token validation endpoint to verify
 * the current token is valid and accepted by the server.
 * 
 * @returns {Promise<boolean>} Promise resolving to token validity status
 */
export async function validateToken(): Promise<boolean> {
  try {
    const response = await get<{ valid: boolean }>(
      `${API_ENDPOINTS.AUTH.LOGIN}/validate`
    );
    
    return response.status === 'success' && response.data && response.data.valid;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Decodes the JWT token to extract payload information
 * 
 * Uses jwt-decode to parse and extract information from the JWT token.
 * This function does not validate the token - use validateToken() for that.
 * 
 * @param {string} token - JWT token to decode
 * @returns {TokenPayload | null} Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt_decode<TokenPayload>(token);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * Initiates a password reset request for the specified email
 * 
 * Sends a request to generate a password reset token that will
 * be emailed to the user's address.
 * 
 * @param {PasswordResetRequest} request - Object containing the user's email
 * @returns {Promise<{ success: boolean }>} Promise resolving to success status
 */
export async function requestPasswordReset(
  request: PasswordResetRequest
): Promise<{ success: boolean }> {
  try {
    const response = await post<{ success: boolean }>(
      `${API_ENDPOINTS.AUTH.LOGIN}/password-reset/request`,
      request
    );
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    return { success: false };
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
}

/**
 * Completes a password reset with the provided token and new password
 * 
 * Finalizes the password reset process by submitting the reset token
 * and the new password.
 * 
 * @param {PasswordResetForm} resetData - Object containing the reset token and new password
 * @returns {Promise<{ success: boolean }>} Promise resolving to success status
 */
export async function resetPassword(
  resetData: PasswordResetForm
): Promise<{ success: boolean }> {
  try {
    const response = await post<{ success: boolean }>(
      `${API_ENDPOINTS.AUTH.LOGIN}/password-reset/confirm`,
      resetData
    );
    
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    
    return { success: false };
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}