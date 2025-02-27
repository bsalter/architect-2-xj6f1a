import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // react-router-dom v6.14.2
import { Site } from '../types/sites';
import useAuth from '../hooks/useAuth';
import useSite from '../hooks/useSite';
import useNotification from '../hooks/useNotification';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import AuthLayout from '../components/layout/AuthLayout';
import LoadingScreen from '../components/shared/LoadingScreen';
import LogoutButton from '../components/auth/LogoutButton';

/**
 * Main component for the site selection page
 * Displayed after login for users with access to multiple sites
 */
const SiteSelection: React.FC = () => {
  // Get authentication state and user data
  const { user, isAuthenticated } = useAuth();
  
  // Get site-related state and functions
  const { userSites, changeSite, setDefaultSite, loading: sitesLoading } = useSite();
  
  // State for selected site and default preference
  const [selectedSiteId, setSelectedSiteId] = useState<number | ''>('');
  const [setAsDefault, setSetAsDefault] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Navigation hook for redirecting after selection
  const navigate = useNavigate();
  
  // Get notification functions for error handling
  const { showError } = useNotification();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !sitesLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, sitesLoading, navigate]);
  
  // Redirect to finder if user only has one site
  useEffect(() => {
    if (userSites.length === 1 && !sitesLoading && isAuthenticated) {
      // If there's only one site, auto-select it and navigate to finder
      changeSite(userSites[0].id)
        .then(() => {
          navigate('/finder');
        })
        .catch((error) => {
          console.error('Auto site selection error:', error);
        });
    }
  }, [userSites, sitesLoading, isAuthenticated, changeSite, navigate]);
  
  /**
   * Handles changes to the site selection dropdown
   */
  const handleSiteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedSiteId(value ? Number(value) : '');
  };
  
  /**
   * Handles changes to the 'set as default' checkbox
   */
  const handleDefaultChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSetAsDefault(event.target.checked);
  };
  
  /**
   * Handles the continue button click to confirm site selection
   */
  const handleContinue = async () => {
    if (!selectedSiteId) {
      showError('Please select a site to continue');
      return;
    }
    
    setLoading(true);
    try {
      // First change the site context
      await changeSite(Number(selectedSiteId));
      
      // If user wants to set as default, save that preference
      if (setAsDefault) {
        setDefaultSite(Number(selectedSiteId), true);
      }
      
      // Navigate to the finder page
      navigate('/finder');
    } catch (error) {
      console.error('Site selection error:', error);
      showError('Failed to set site context. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading screen while sites are loading
  if (sitesLoading || !isAuthenticated) {
    return <LoadingScreen message="Loading available sites..." />;
  }
  
  // If no sites are available, show a message
  if (userSites.length === 0) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Sites Available</h2>
          <p className="mt-4 text-gray-600">
            You do not have access to any sites. Please contact your administrator.
          </p>
          <div className="mt-6">
            <LogoutButton variant="outline" />
          </div>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select a Site</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please select a site to continue
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="site-select" className="block text-sm font-medium text-gray-700 mb-1">
            Choose Site
          </label>
          <Select
            id="site-select"
            name="site"
            value={selectedSiteId.toString()}
            onChange={handleSiteChange}
            placeholder="Choose Site"
          >
            {userSites.map((site) => (
              <option key={site.id} value={site.id.toString()}>
                {site.name}
              </option>
            ))}
          </Select>
        </div>
        
        <div>
          <Checkbox
            name="set-default"
            label="Set as default site"
            checked={setAsDefault}
            onChange={handleDefaultChange}
          />
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={!selectedSiteId}
            isLoading={loading}
          >
            Continue
          </Button>
          <LogoutButton variant="outline" />
        </div>
      </div>
    </AuthLayout>
  );
};

export default SiteSelection;