/**
 * Centralized export file for all type definitions used throughout the application.
 * This barrel file re-exports all TypeScript types, interfaces, and enums from their
 * respective definition files to provide a single import source for consumers.
 * 
 * @example
 * import { Interaction, User, ApiResponse } from '../types';
 * 
 * @version 4.9.5  // TypeScript version as specified in technical requirements
 */

// Re-export all API-related type definitions
export * from './api';

// Re-export all authentication-related type definitions
export * from './auth';

// Re-export all interaction-related type definitions
export * from './interactions';

// Re-export all site-related type definitions
export * from './sites';