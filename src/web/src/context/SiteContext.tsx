import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'; // react v18.2.0
import { Site, SiteContextType } from '../types/sites';
import { getSites, setActiveSite } from '../api/sites';
import { getSiteContext, setSiteContext } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';

/**
 * Creates the site context with default value
 * @returns The created context with a null default value
 */
const createSiteContext = (): React.Context<SiteContextType | null> => {
  return createContext<SiteContextType | null>(null);
};

// Create the site context
const SiteContext = createSiteContext();

/**
 * Provider component that wraps the application to provide site context
 * Manages loading sites, selecting the active site, and handling site switching
 * 
 * @param props - Component props
 * @param props.children - Child components to render within the provider
 * @returns The provider component with context value
 */
const SiteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get authentication state using useAuth hook
  const { user, isAuthenticated, registerLogoutCallback } = useAuth();
  
  // Initialize state
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [userSites, setUserSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetches available sites for the current user
   */
  const fetchSites = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSites();
      
      // Check multiple possible response structures
      const sites = 
        // If response is ApiResponse<SiteListResponse>
        (response.status === 'success' && response.data && response.data.sites) ? response.data.sites :
        // If response is SiteListResponse
        (response.sites) ? response.sites :
        // Default to empty array
        [];
      
      setUserSites(sites);
      
      if (sites.length === 0) {
        setError('You do not have access to any sites.');
      }
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Failed to load site data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Changes the active site context
   * 
   * @param siteId - The ID of the site to set as active
   * @returns Promise that resolves when site is changed
   * @throws Error if site change fails
   */
  const handleSetSite = useCallback(async (siteId: number): Promise<void> => {
    try {
      // Validate that the requested site exists in userSites
      const siteExists = userSites.some(site => site.id === siteId);
      if (!siteExists) {
        throw new Error('Site not found in user\'s available sites');
      }
      
      // Update site context on server
      const response = await setActiveSite(siteId);
      
      // Check multiple possible response structures
      const currentSite = 
        // If response is ApiResponse<{ success: boolean; currentSite: Site }>
        (response.status === 'success' && response.data && response.data.currentSite) ? response.data.currentSite :
        // If response is { success: boolean; currentSite: Site }
        (response.currentSite) ? response.currentSite :
        // Default to null
        null;
      
      if (currentSite) {
        // Update local state
        setCurrentSite(currentSite);
        
        // Store in browser storage (set as default)
        setSiteContext(siteId, true);
      } else {
        throw new Error('Failed to set site context');
      }
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Failed to set site context';
      setError(errorMessage);
      throw err; // Rethrow to allow caller to handle
    }
  }, [userSites]);
  
  // Load sites when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSites();
    } else {
      setUserSites([]);
      setCurrentSite(null);
    }
  }, [isAuthenticated, fetchSites]);
  
  // Set initial site on first load
  useEffect(() => {
    if (userSites.length > 0 && !currentSite) {
      // Try to get stored site context
      const storedSiteId = getSiteContext();
      
      if (storedSiteId && userSites.some(site => site.id === storedSiteId)) {
        // If stored site exists in user's sites, set it as current
        const site = userSites.find(site => site.id === storedSiteId);
        setCurrentSite(site || null);
      } else if (userSites.length > 0) {
        // Otherwise, default to first available site
        setCurrentSite(userSites[0]);
        setSiteContext(userSites[0].id, true);
      }
    }
  }, [userSites, currentSite]);
  
  // Register logout callback to clear site context on logout
  useEffect(() => {
    const unregister = registerLogoutCallback(() => {
      setCurrentSite(null);
      setUserSites([]);
    });
    
    // Clean up by unregistering the callback when component unmounts
    return () => {
      unregister();
    };
  }, [registerLogoutCallback]);
  
  // Create context value object with state and functions
  const contextValue: SiteContextType = {
    currentSite,
    userSites,
    loading,
    error,
    setSite: handleSetSite
  };
  
  return (
    <SiteContext.Provider value={contextValue}>
      {children}
    </SiteContext.Provider>
  );
};

/**
 * Custom hook to access site context
 * 
 * @returns The site context value
 * @throws Error if used outside of SiteProvider
 */
const useSiteContext = (): SiteContextType => {
  const context = useContext(SiteContext);
  
  if (context === null) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  
  return context;
};

export { SiteContext, SiteProvider, useSiteContext };