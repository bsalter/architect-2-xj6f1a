import React from 'react'; // v18.2.0
import { useNavigate } from 'react-router-dom'; // v6.14.2
import Button from '../ui/Button';

/**
 * Props interface for the NotFound component
 */
export interface NotFoundProps {
  /**
   * The title to display in the not found message
   * @default 'Not Found'
   */
  title?: string;
  
  /**
   * The descriptive message to display about the not found state
   * @default 'The requested resource could not be found.'
   */
  message?: string;
  
  /**
   * The route to navigate to when clicking the back button
   * @default '/'
   */
  backRoute?: string;
  
  /**
   * The label for the back button
   * @default 'Go Back'
   */
  backLabel?: string;
}

/**
 * A reusable component that displays a 'not found' message when a resource
 * or page cannot be found, providing a consistent error experience.
 */
export const NotFound: React.FC<NotFoundProps> = ({
  title = 'Not Found',
  message = 'The requested resource could not be found.',
  backRoute = '/',
  backLabel = 'Go Back'
}) => {
  const navigate = useNavigate();
  
  const handleNavigation = () => {
    navigate(backRoute);
  };
  
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="max-w-md">
        <svg 
          className="w-16 h-16 text-gray-400 mb-6 mx-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-800 mb-4" data-testid="not-found-title">{title}</h1>
        <p className="text-gray-600 mb-8" data-testid="not-found-message">{message}</p>
        <Button 
          onClick={handleNavigation} 
          variant="primary" 
          data-testid="not-found-button"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;