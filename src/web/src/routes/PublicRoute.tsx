import React, { ReactNode } from 'react'; // react v18.2.0
import { Navigate, Outlet } from 'react-router-dom'; // react-router-dom v6.14.2
import useAuth from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

/**
 * Props for the PublicRoute component
 */
interface PublicRouteProps {
  /**
   * The path to redirect authenticated users to
   * Defaults to the Finder page if not specified
   */
  redirectTo?: string;
  
  /**
   * Optional children to render instead of using Outlet
   */
  children?: ReactNode;
}

/**
 * Component that redirects authenticated users to a specified route,
 * allowing access only to unauthenticated users
 * 
 * This component is used to protect public routes like login and password reset
 * from being accessed by already authenticated users.
 * 
 * @param props - Component props
 * @returns JSX.Element - Either redirects to a protected route or renders the public route content
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ 
  redirectTo = ROUTES.FINDER,
  children 
}) => {
  // Check if user is authenticated using the auth hook
  const { isAuthenticated } = useAuth();
  
  // If user is authenticated, redirect to the specified path or Finder
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // If user is not authenticated, render the Outlet (or children if provided)
  return children ? <>{children}</> : <Outlet />;
};

export default PublicRoute;