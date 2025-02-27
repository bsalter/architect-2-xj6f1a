import React, { ReactNode } from 'react';
import classNames from 'classnames'; // v2.3.3
import LoadingScreen from '../shared/LoadingScreen';
import useAuth from '../../hooks/useAuth';
import logo from '../../assets/images/logo.svg';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
  showLogo?: boolean;
}

/**
 * Layout component for authentication pages that provides a consistent structure and styling
 * This layout is used for pages like login, forgot password, and password reset to ensure
 * visual consistency while keeping them separate from the main application layout.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  className = '',
  showLogo = true
}) => {
  // Get authentication loading state to show appropriate indicators
  const { loading } = useAuth();

  // Show loading screen when authentication is in progress
  if (loading) {
    return <LoadingScreen fullScreen showLogo message="Authenticating..." />;
  }

  return (
    <div 
      className={classNames(
        'min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8', 
        className
      )}
    >
      {/* Logo section - conditionally displayed */}
      {showLogo && (
        <div className="mb-8">
          <img 
            src={logo} 
            alt="Interaction Management" 
            className="h-16 w-auto" 
          />
        </div>
      )}
      
      {/* Authentication card container */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 sm:p-8">
        {children}
      </div>
      
      {/* Footer with copyright information */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Interaction Management System
      </div>
    </div>
  );
};

export default AuthLayout;