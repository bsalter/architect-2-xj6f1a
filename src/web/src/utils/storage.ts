/**
 * Storage utility functions for handling client-side storage operations
 * including JWT tokens, site context, and user preferences.
 * 
 * This module provides a secure and consistent way to access browser storage
 * with support for expiration, type conversion, and cross-storage access.
 * 
 * @version 1.0.0
 */

// Enum for specifying which storage type to use
export enum StorageType {
  Local = 'localStorage',
  Session = 'sessionStorage'
}

// Constants for storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const SITE_CONTEXT_KEY = 'site_context';

// Interface for items with expiration
interface StorageItemWithExpiration {
  value: any;
  expiration: number;
}

/**
 * Stores a value in browser storage with optional expiration
 * 
 * @param key - The key to store the value under
 * @param value - The value to store
 * @param storageType - Which storage to use (localStorage or sessionStorage)
 * @param expirationInMinutes - Optional expiration time in minutes
 */
export function setItem(key: string, value: any, storageType: StorageType, expirationInMinutes?: number): void {
  try {
    // Prepare the value to be stored
    let valueToStore: string;
    
    // If the value isn't a string, stringify it
    if (typeof value !== 'string') {
      valueToStore = JSON.stringify(value);
    } else {
      valueToStore = value;
    }
    
    // If expiration is set, wrap the value with expiration metadata
    if (expirationInMinutes) {
      const expirationMs = expirationInMinutes * 60 * 1000;
      const expiration = new Date().getTime() + expirationMs;
      
      const itemWithExpiration: StorageItemWithExpiration = {
        value: valueToStore,
        expiration
      };
      
      valueToStore = JSON.stringify(itemWithExpiration);
    }
    
    // Store in the appropriate storage
    window[storageType].setItem(key, valueToStore);
  } catch (error) {
    console.error(`Error storing item in ${storageType}:`, error);
  }
}

/**
 * Retrieves a value from browser storage, handling expiration and parsing
 * 
 * @param key - The key to retrieve
 * @param storageType - Which storage to use (localStorage or sessionStorage)
 * @param defaultValue - Default value to return if key is not found or expired
 * @returns The stored value or defaultValue if not found or expired
 */
export function getItem(key: string, storageType: StorageType, defaultValue: any = null): any {
  try {
    // Get raw value from storage
    const item = window[storageType].getItem(key);
    
    // Return default value if not found
    if (item === null) {
      return defaultValue;
    }
    
    // Try to parse the item as JSON
    try {
      const parsedItem = JSON.parse(item);
      
      // Check if this is an item with expiration
      if (parsedItem && typeof parsedItem === 'object' && 'expiration' in parsedItem) {
        const { value, expiration } = parsedItem as StorageItemWithExpiration;
        
        // If expired, remove the item and return default value
        if (expiration && new Date().getTime() > expiration) {
          removeItem(key, storageType);
          return defaultValue;
        }
        
        // Return the value (parse it if it's a JSON string)
        return typeof value === 'string' ? tryParseJSON(value) : value;
      }
      
      // Return the parsed value
      return parsedItem;
    } catch (e) {
      // If not valid JSON, return the raw value
      return item;
    }
  } catch (error) {
    console.error(`Error retrieving item from ${storageType}:`, error);
    return defaultValue;
  }
}

/**
 * Removes an item from browser storage
 * 
 * @param key - The key to remove
 * @param storageType - Which storage to use (localStorage or sessionStorage)
 */
export function removeItem(key: string, storageType: StorageType): void {
  try {
    window[storageType].removeItem(key);
  } catch (error) {
    console.error(`Error removing item from ${storageType}:`, error);
  }
}

/**
 * Clears all items from the specified storage or both
 * 
 * @param storageType - Which storage to clear (if not provided, clears both)
 */
export function clear(storageType?: StorageType): void {
  try {
    if (storageType) {
      window[storageType].clear();
    } else {
      // Clear both storage types
      window[StorageType.Local].clear();
      window[StorageType.Session].clear();
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

/**
 * Stores the authentication JWT token
 * 
 * @param token - The JWT token to store
 * @param rememberMe - If true, store in localStorage for persistence, otherwise sessionStorage
 */
export function setToken(token: string, rememberMe: boolean = false): void {
  const storageType = rememberMe ? StorageType.Local : StorageType.Session;
  // If using localStorage, set a longer expiration (24 hours as specified in technical specs)
  // If using sessionStorage, no need for expiration as it's cleared when the session ends
  const expirationInMinutes = rememberMe ? 24 * 60 : undefined; // 24 hours if rememberMe
  
  setItem(AUTH_TOKEN_KEY, token, storageType, expirationInMinutes);
}

/**
 * Retrieves the stored authentication JWT token
 * 
 * @returns The stored token or null if not found
 */
export function getToken(): string | null {
  // Try localStorage first, then sessionStorage
  let token = getItem(AUTH_TOKEN_KEY, StorageType.Local, null);
  
  if (!token) {
    token = getItem(AUTH_TOKEN_KEY, StorageType.Session, null);
  }
  
  return token;
}

/**
 * Removes the authentication token from storage
 */
export function removeToken(): void {
  // Remove from both storage types to ensure complete logout
  removeItem(AUTH_TOKEN_KEY, StorageType.Local);
  removeItem(AUTH_TOKEN_KEY, StorageType.Session);
}

/**
 * Stores the current site context
 * 
 * @param siteId - The site ID to store
 * @param setAsDefault - If true, store in localStorage as the default site
 */
export function setSiteContext(siteId: number, setAsDefault: boolean): void {
  const storageType = setAsDefault ? StorageType.Local : StorageType.Session;
  setItem(SITE_CONTEXT_KEY, siteId, storageType);
}

/**
 * Retrieves the stored site context
 * 
 * @returns The stored site ID or null if not found
 */
export function getSiteContext(): number | null {
  // Try localStorage first, then sessionStorage
  let siteId = getItem(SITE_CONTEXT_KEY, StorageType.Local, null);
  
  if (siteId === null) {
    siteId = getItem(SITE_CONTEXT_KEY, StorageType.Session, null);
  }
  
  return siteId;
}

/**
 * Removes the site context from storage
 */
export function removeSiteContext(): void {
  // Remove from both storage types
  removeItem(SITE_CONTEXT_KEY, StorageType.Local);
  removeItem(SITE_CONTEXT_KEY, StorageType.Session);
}

/**
 * Checks if the specified storage type is available in the current environment
 * 
 * @param storageType - Which storage to check
 * @returns True if storage is available, false otherwise
 */
export function isStorageAvailable(storageType: StorageType): boolean {
  try {
    const storage = window[storageType];
    const testKey = '__storage_test__';
    
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    
    return true;
  } catch (e) {
    // Error may occur in private browsing mode or when cookies are disabled
    return false;
  }
}

/**
 * Helper function to try parsing a JSON string
 * Returns the parsed object or the original string if parsing fails
 */
function tryParseJSON(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return jsonString;
  }
}