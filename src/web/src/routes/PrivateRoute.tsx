import React from 'react'; // react v18.2.0
import { Navigate, Outlet } from 'react-router-dom'; // react-router-dom v6.14.2
import useAuth from '../hooks/useAuth';
import useSite from '../hooks/useSite';
import LoadingScreen from '../components/shared/LoadingScreen';

/**
 * A route wrapper component that ensures protected routes are only accessible 
 * to authenticated users. It redirects unauthenticated users to the login page,
 * handles loading states during authentication verification, and manages site
 * context validation for authenticated users.
 * 
 * @returns JSX.Element - Either the protected route content (Outlet), a loading screen, or a redirect
 */
const PrivateRoute: React.FC = () => {
  // Get authentication state using the useAuth hook
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Get site context using the useSite hook
  const { currentSite, loading: siteLoading } = useSite();
  
  // Show loading screen while auth state or site context is being loaded
  if (authLoading || siteLoading) {
    return <LoadingScreen message="Checking access..." />;
  }
  
  // If user is not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is authenticated but doesn't have a current site, redirect to site selection page
  if (isAuthenticated && !currentSite) {
    return <Navigate to="/select-site" replace />;
  }
  
  // If user is authenticated and has a current site, render the protected route content (Outlet)
  return <Outlet />;
};

export default PrivateRoute;