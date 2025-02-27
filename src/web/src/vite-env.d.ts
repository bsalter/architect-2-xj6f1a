/// <reference path="../node_modules/vite/client" />

/**
 * Extension of the import.meta object with Vite-specific properties
 * Provide type definitions for the import.meta object in Vite applications
 */
interface ImportMeta {
  /**
   * Vite-specific environment variables and other runtime information
   */
  readonly env: ImportMetaEnv;
}

/**
 * Type definitions for environment variables available through import.meta.env
 * Enable TypeScript to recognize environment variables specific to the Interaction Management System
 */
interface ImportMetaEnv {
  /**
   * Base URL for API requests in the Interaction Management System
   */
  readonly VITE_API_BASE_URL: string;

  /**
   * URL for the authentication provider (Auth0)
   */
  readonly VITE_AUTH_PROVIDER_URL: string;

  /**
   * Application version
   */
  readonly VITE_APP_VERSION: string;

  /**
   * Current mode (development, production, etc.)
   */
  readonly VITE_MODE: string;

  /**
   * Flag indicating if the application is running in development mode
   */
  readonly VITE_DEV: boolean;

  /**
   * Flag indicating if the application is running in production mode
   */
  readonly VITE_PROD: boolean;

  /**
   * Base URL for the application (provided by Vite)
   */
  readonly BASE_URL: string;

  /**
   * Allow for additional environment variables
   */
  [key: string]: any;
}