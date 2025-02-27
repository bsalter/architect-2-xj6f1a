import React, { useState, useEffect } from 'react'; // react v18.2.0
import { useNavigate } from 'react-router-dom'; // react-router-dom v6.14.2

import LoginForm from '../components/auth/LoginForm';
import AuthLayout from '../components/layout/AuthLayout';
import useAuth from '../hooks/useAuth';
import useNotification from '../hooks/useNotification';
import LoadingScreen from '../components/shared/LoadingScreen';

/**
 * Login page component that renders the authentication interface, handles login flow,
 * and redirects users to appropriate pages based on their site associations and
 * authentication status.
 */
const Login: React.FC = () => {
  // State for tracking navigation loading after successful login
  const [loading, setLoading] = useState<boolean>(false);
  
  // Navigation hook for redirecting after login
  const navigate = useNavigate();
  
  // Get authentication state and methods
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // Get notification methods
  const { showSuccess } = useNotification();
  
  // Effect to redirect already authenticated users
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      // Determine where to redirect based on user's site associations
      if (user.sites.length > 1) {
        navigate('/sites/select');
      } else if (user.sites.length === 1) {
        navigate('/finder');
      }
    }
  }, [isAuthenticated, user, loading, navigate]);
  
  /**
   * Handler for successful login
   * Shows success notification and navigates to appropriate page
   */
  const handleLoginSuccess = () => {
    setLoading(true);
    showSuccess('Login successful');
    
    // Check if user has multiple sites to determine redirection
    if (user && user.sites.length > 1) {
      navigate('/sites/select');
    } else {
      navigate('/finder');
    }
  };
  
  // Show loading screen during authentication or navigation
  if (authLoading || loading) {
    return <LoadingScreen message="Authenticating..." fullScreen />;
  }
  
  // Render login form within authentication layout
  return (
    <AuthLayout showLogo>
      <LoginForm 
        onSuccess={handleLoginSuccess}
        redirectPath="/forgot-password"
      />
    </AuthLayout>
  );
};

export default Login;