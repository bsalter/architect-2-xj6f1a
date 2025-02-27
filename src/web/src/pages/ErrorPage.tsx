import React from 'react';
import { useNavigate } from 'react-router-dom'; // v6.14.2
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import MainLayout from '../components/layout/MainLayout';
import { ERROR_MESSAGES } from '../utils/constants';

/**
 * Props interface for the ErrorPage component
 */
interface ErrorPageProps {
  title: string;
  message: string;
  status: string;
}

/**
 * Renders an error page with a user-friendly message and recovery options
 */
const ErrorPage: React.FC<ErrorPageProps> = ({ 
  title = 'An Error Occurred', 
  message = ERROR_MESSAGES.GENERAL.UNKNOWN, 
  status 
}) => {
  // Initialize the navigate function for routing
  const navigate = useNavigate();
  
  // Handle goBack function to navigate to the previous page
  const goBack = () => {
    navigate(-1);
  };
  
  // Handle goHome function to navigate to the Finder page
  const goHome = () => {
    navigate('/finder');
  };
  
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] py-8">
        <Card className="max-w-lg w-full mx-auto">
          <div className="text-center py-8 px-6">
            <Alert 
              variant="error" 
              className="mb-6"
            >
              {message}
            </Alert>
            
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
              {title}
            </h1>
            
            {status && (
              <p className="text-gray-600 mb-8">
                Status code: {status}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={goBack}
              >
                Go Back
              </Button>
              <Button 
                variant="primary" 
                onClick={goHome}
              >
                Go to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ErrorPage;