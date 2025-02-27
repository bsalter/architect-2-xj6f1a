import React from 'react'; // v18.2.0
import NotFound from '../components/shared/NotFound';
import AuthLayout from '../components/layout/AuthLayout';
import { ERROR_MESSAGES } from '../utils/constants';

/**
 * A functional component that renders the 404 page not found screen
 * when users navigate to a non-existent route in the application.
 * Provides a user-friendly error experience with navigation options.
 * 
 * @returns The rendered 404 page component
 */
const PageNotFound: React.FC = () => {
  return (
    <AuthLayout>
      <NotFound 
        title="Page Not Found"
        message="The page you are looking for does not exist or has been moved."
        backRoute="/finder"
        backLabel="Back to Finder"
      />
    </AuthLayout>
  );
};

export default PageNotFound;