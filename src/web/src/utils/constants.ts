/**
 * Constants used throughout the application
 * This file serves as a centralized repository for constant values to ensure consistency
 * across the application and make maintenance easier.
 */

// API Constants
// -------------

/**
 * Base URL for all API requests
 * @version 1.0.0
 */
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * API version to be used in request URLs
 * @version 1.0.0
 */
export const API_VERSION = 'v1';

/**
 * API endpoints for different resources
 * @version 1.0.0
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `/api/${API_VERSION}/auth/login`,
    LOGOUT: `/api/${API_VERSION}/auth/logout`,
    ME: `/api/${API_VERSION}/auth/me`,
    SITES: `/api/${API_VERSION}/auth/sites`,
    SITE: `/api/${API_VERSION}/auth/site`
  },
  INTERACTIONS: {
    BASE: `/api/${API_VERSION}/interactions`,
    DETAILS: (id: number | string) => `/api/${API_VERSION}/interactions/${id}`
  },
  SITES: {
    BASE: `/api/${API_VERSION}/sites`,
    DETAILS: (id: number | string) => `/api/${API_VERSION}/sites/${id}`,
    USERS: (id: number | string) => `/api/${API_VERSION}/sites/${id}/users`
  }
};

/**
 * Default timeout for API requests in milliseconds (30 seconds)
 * @version 1.0.0
 */
export const REQUEST_TIMEOUT = 30000;

// Authentication Constants
// -----------------------

/**
 * Authentication-related constants
 * @version 1.0.0
 */
export const AUTH_CONSTANTS = {
  /**
   * Local storage key for storing the authentication token
   */
  TOKEN_STORAGE_KEY: 'interaction_mgmt_token',
  
  /**
   * Local storage key for storing user information
   */
  USER_STORAGE_KEY: 'interaction_mgmt_user',
  
  /**
   * Token expiration time in milliseconds (24 hours)
   */
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000
};

/**
 * Buffer time before token expiration to trigger refresh (15 minutes)
 * @version 1.0.0
 */
export const TOKEN_EXPIRY_BUFFER = 15 * 60 * 1000;

// Site Constants
// --------------

/**
 * Site context related constants
 * @version 1.0.0
 */
export const SITE_CONSTANTS = {
  /**
   * Local storage key for storing the current site context
   */
  SITE_STORAGE_KEY: 'interaction_mgmt_site',
  
  /**
   * Local storage key for storing the default site preference
   */
  DEFAULT_SITE_KEY: 'interaction_mgmt_default_site'
};

// Interaction Constants
// --------------------

/**
 * List of valid interaction types
 * @version 1.0.0
 */
export const INTERACTION_TYPES = [
  'MEETING',
  'CALL',
  'EMAIL',
  'UPDATE',
  'REVIEW',
  'TRAINING',
  'OTHER'
];

/**
 * Human-readable labels for interaction types
 * @version 1.0.0
 */
export const INTERACTION_TYPE_LABELS = {
  MEETING: 'Meeting',
  CALL: 'Call',
  EMAIL: 'Email',
  UPDATE: 'Update',
  REVIEW: 'Review',
  TRAINING: 'Training',
  OTHER: 'Other'
};

/**
 * Timezone options for the timezone selector
 * @version 1.0.0
 */
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];

/**
 * Default values for new interaction records
 * @version 1.0.0
 */
export const DEFAULT_INTERACTION_VALUES = {
  title: '',
  type: 'MEETING',
  lead: '',
  startDateTime: new Date(),
  timezone: 'America/New_York',
  endDateTime: new Date(new Date().setHours(new Date().getHours() + 1)),
  location: '',
  description: '',
  notes: ''
};

/**
 * Field identifiers for sorting interactions in the finder
 * @version 1.0.0
 */
export const INTERACTION_SORT_FIELDS = {
  TITLE: 'title',
  TYPE: 'type',
  LEAD: 'lead',
  START_DATE: 'startDateTime',
  END_DATE: 'endDateTime',
  LOCATION: 'location',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt'
};

// Form Validation Constants
// ------------------------

/**
 * Validation constraints and messages for form fields
 * @version 1.0.0
 */
export const FORM_VALIDATION = {
  REQUIRED_MESSAGE: 'This field is required',
  MAX_TITLE_LENGTH: 255,
  MAX_LEAD_LENGTH: 100,
  MAX_LOCATION_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_NOTES_LENGTH: 5000,
  DATE_VALIDATION: {
    PAST_START_DATE: 'Start date cannot be in the past',
    END_BEFORE_START: 'End date must be after start date',
    INVALID_DATE: 'Please enter a valid date'
  }
};

// Table Constants
// --------------

/**
 * Constants for the interaction finder table
 * @version 1.0.0
 */
export const TABLE_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  INTERACTION_COLUMNS: [
    { id: 'title', label: 'Title', sortable: true },
    { id: 'type', label: 'Type', sortable: true },
    { id: 'lead', label: 'Lead', sortable: true },
    { id: 'startDateTime', label: 'Start Date/Time', sortable: true },
    { id: 'timezone', label: 'Timezone', sortable: false },
    { id: 'endDateTime', label: 'End Date/Time', sortable: true },
    { id: 'location', label: 'Location', sortable: true },
    { id: 'actions', label: 'Actions', sortable: false }
  ],
  DEFAULT_SORT_FIELD: 'startDateTime',
  DEFAULT_SORT_DIRECTION: 'desc'
};

// Date Format Constants
// -------------------

/**
 * Date and time formatting constants
 * @version 1.0.0
 */
export const DATE_FORMAT_CONSTANTS = {
  DATE_FORMAT: 'MM/dd/yyyy',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'MM/dd/yyyy HH:mm',
  API_DATE_FORMAT: 'yyyy-MM-dd\'T\'HH:mm:ss'
};

// Error Messages
// -------------

/**
 * Error messages shown to users
 * @version 1.0.0
 */
export const ERROR_MESSAGES = {
  AUTHENTICATION: {
    INVALID_CREDENTIALS: 'Invalid username or password',
    SESSION_EXPIRED: 'Your session has expired. Please log in again',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    LOGIN_FAILED: 'Login failed. Please try again'
  },
  INTERACTION: {
    CREATE_FAILED: 'Failed to create interaction',
    UPDATE_FAILED: 'Failed to update interaction',
    DELETE_FAILED: 'Failed to delete interaction',
    LOAD_FAILED: 'Failed to load interaction details',
    SEARCH_FAILED: 'Failed to search interactions'
  },
  SITE: {
    LOAD_FAILED: 'Failed to load site data',
    SWITCH_FAILED: 'Failed to switch site context',
    NO_SITES: 'You do not have access to any sites'
  },
  GENERAL: {
    NETWORK_ERROR: 'Network error. Please check your connection',
    SERVER_ERROR: 'Server error. Please try again later',
    TIMEOUT: 'Request timed out. Please try again',
    UNKNOWN: 'An unknown error occurred'
  }
};

// Storage Keys
// -----------

/**
 * Keys used for storing data in browser's local storage
 * @version 1.0.0
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'interaction_mgmt_token',
  USER_DATA: 'interaction_mgmt_user',
  ACTIVE_SITE: 'interaction_mgmt_site',
  SEARCH_PREFERENCES: 'interaction_mgmt_search_prefs'
};