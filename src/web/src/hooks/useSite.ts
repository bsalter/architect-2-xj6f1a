import { useState, useCallback, useEffect } from 'react'; // react v18.2.0
import { useSiteContext } from '../context/SiteContext';
import { Site } from '../types/sites';
import { setSiteContext } from '../utils/storage';
import useNotification from './useNotification';

/**
 * Custom hook to access and manage site-related state and functionality
 * 
 * @returns Object containing site state and methods { currentSite, userSites, loading, error, changeSite, setDefaultSite, refreshSites }
 */
const useSite = () => {
  // Access the site context
  const { currentSite, userSites, loading, error, setSite } = useSiteContext();
  
  // Initialize notification hooks
  const { showSuccess, showError } = useNotification();
  
  /**
   * Changes the active site and handles success/error notifications
   * 
   * @param siteId - The ID of the site to set as active
   * @returns Promise that resolves when the site is changed successfully
   */
  const changeSite = useCallback(async (siteId: number): Promise<void> => {
    if (!siteId) {
      showError('Invalid site ID');
      return Promise.reject(new Error('Invalid site ID'));
    }
    
    try {
      await setSite(siteId);
      showSuccess('Site switched successfully');
    } catch (error: any) {
      const errorMessage = error.error?.message || 'Failed to switch site';
      showError(errorMessage);
      throw error; // Re-throw to allow caller to handle
    }
  }, [setSite, showSuccess, showError]);
  
  /**
   * Sets the current site as the default for future sessions
   * 
   * @param siteId - The ID of the site to set as default
   * @param isDefault - Whether to set as default
   */
  const setDefaultSite = useCallback((siteId: number, isDefault: boolean): void => {
    setSiteContext(siteId, isDefault);
    
    if (isDefault) {
      showSuccess('Default site set successfully');
    }
  }, [showSuccess]);
  
  /**
   * Reloads the list of available sites for the user
   * 
   * @returns Promise that resolves when sites are refreshed
   */
  const refreshSites = useCallback(async (): Promise<void> => {
    // Currently, the SiteContext doesn't expose a direct way to refresh sites,
    // but this function is included for future extensibility
    return Promise.resolve();
  }, []);

  return {
    currentSite,
    userSites,
    loading,
    error,
    changeSite,
    setDefaultSite,
    refreshSites
  };
};

export default useSite;