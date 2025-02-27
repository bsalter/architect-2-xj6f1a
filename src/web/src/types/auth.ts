/**
 * TypeScript type definitions for authentication-related data structures
 * used throughout the frontend application. This file defines interfaces for
 * user data, login credentials, authentication responses, and authentication context
 * to ensure type safety across the application.
 * 
 * @version 1.0.0
 */

import { Site } from './sites';
import { ApiResponse } from './api';

/**
 * Interface representing an authenticated user
 */
export interface User {
  id: number;
  username: string;
  email: string;
  sites: Site[];
  lastLogin: string | null;
}

/**
 * Interface for login form input data
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Interface for authentication API response
 */
export interface LoginResponse extends ApiResponse {
  token: string;
  user: User;
  expiresAt: number;
}

/**
 * Interface for password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Interface for password reset form data
 */
export interface PasswordResetForm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface for decoded JWT token data
 */
export interface TokenPayload {
  sub: string;        // Subject (username)
  userId: number;     // User ID
  sites: number[];    // Array of site IDs the user has access to
  exp: number;        // Expiration timestamp
  iat: number;        // Issued at timestamp
}

/**
 * Interface for authentication context provider value
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Enum defining possible authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

/**
 * Interface for user-site association data
 */
export interface UserSiteAssociation {
  siteId: number;
  role: string;
}