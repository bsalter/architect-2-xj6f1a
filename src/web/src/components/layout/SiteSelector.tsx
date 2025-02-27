import React, { useState, useCallback, ChangeEvent } from 'react'; // react v18.2.0
import classNames from 'classnames'; // classnames v2.3.2

// Custom hooks
import useSite from '../../hooks/useSite';

// UI Components
import Select from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import Spinner from '../ui/Spinner';

// Types
import { Site } from '../../types/sites';

/**
 * Props interface for the SiteSelector component
 */
export interface SiteSelectorProps {
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Whether to show the option to set a site as default
   * @default true
   */
  showDefaultOption?: boolean;
}

/**
 * A component that allows users to select and switch between sites they have access to.
 * It displays the current site and provides a dropdown menu for selecting other sites,
 * implementing a critical part of the site-scoping security feature.
 */
const SiteSelector: React.FC<SiteSelectorProps> = ({
  className = '',
  showDefaultOption = true
}) => {
  // Get site data and functions from the useSite hook
  const { currentSite, userSites, loading, changeSite, setDefaultSite } = useSite();
  
  // Local state for the "set as default" checkbox
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  /**
   * Handles the site selection change event from the dropdown
   */
  const handleSiteChange = useCallback(async (event: ChangeEvent<HTMLSelectElement>) => {
    const siteId = parseInt(event.target.value, 10);
    
    try {
      await changeSite(siteId);
      
      // If "set as default" is checked, set this site as the default
      if (setAsDefault) {
        setDefaultSite(siteId, true);
      }
    } catch (error) {
      // Error handling is done in the useSite hook
    }
  }, [changeSite, setAsDefault, setDefaultSite]);
  
  /**
   * Toggles the 'set as default' checkbox state
   */
  const handleSetDefaultChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSetAsDefault(event.target.checked);
    
    // If already on a site and the checkbox is checked, set current site as default
    if (currentSite && event.target.checked) {
      setDefaultSite(currentSite.id, true);
    }
  }, [currentSite, setDefaultSite]);
  
  // Show loading spinner while sites are being loaded
  if (loading) {
    return (
      <div className={classNames('flex items-center', className)} aria-live="polite">
        <Spinner size="sm" label="Loading sites..." />
      </div>
    );
  }
  
  // If user has only one site, just display the site name without dropdown
  if (userSites.length === 1 && currentSite) {
    return (
      <div className={classNames('flex items-center', className)}>
        <span className="font-medium">
          {currentSite.name}
        </span>
      </div>
    );
  }
  
  // Render dropdown for site selection if user has multiple sites
  return (
    <div className={classNames('flex flex-col', className)}>
      <div className="flex items-center">
        <label htmlFor="site-selector" className="sr-only">
          Select site
        </label>
        <Select 
          id="site-selector"
          name="site-selector"
          value={currentSite?.id.toString()}
          onChange={handleSiteChange}
        >
          {userSites.map((site) => (
            <option key={site.id} value={site.id.toString()}>
              {site.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Option to set as default site, only shown when specified and user has multiple sites */}
      {showDefaultOption && userSites.length > 1 && (
        <div className="mt-2">
          <Checkbox 
            name="set-default-site"
            checked={setAsDefault}
            onChange={handleSetDefaultChange}
            label="Set as default site"
          />
        </div>
      )}
    </div>
  );
};

export default SiteSelector;