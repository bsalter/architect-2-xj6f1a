import React from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // v6.14.2
import { Helmet } from 'react-helmet-async'; // v7.0.0
import AuthLayout from '../components/layout/AuthLayout';
import PasswordResetForm from '../components/auth/PasswordResetForm';
import { useNotification } from '../hooks/useNotification';

/**
 * Page component that renders the password reset form.
 * Extracts the reset token from URL parameters and handles redirection after successful reset.
 */
const ResetPassword: React.FC = () => {
  // Extract token from URL parameters
  const { token } = useParams<{ token?: string }>();
  
  // Initialize navigation function for redirection
  const navigate = useNavigate();
  
  // Get notification functionality
  const { showSuccess } = useNotification();
  
  /**
   * Handles successful password reset
   * Shows a success notification and redirects to login page
   */
  const handleResetSuccess = () => {
    showSuccess('Your password has been reset successfully. Please login with your new password.');
    navigate('/login');
  };
  
  return (
    <AuthLayout>
      <Helmet>
        <title>Reset Password | Interaction Management</title>
        <meta name="description" content="Reset your password to access the Interaction Management System" />
      </Helmet>
      
      <h1 className="text-2xl font-bold text-center mb-6">Reset Your Password</h1>
      
      {token ? (
        <PasswordResetForm 
          token={token} 
          onSuccess={handleResetSuccess} 
        />
      ) : (
        <div className="text-center">
          <p className="text-red-600 mb-4">No reset token provided. You need a valid token to reset your password.</p>
          <p>
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Request a new password reset link
            </a>
          </p>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <a href="/login" className="text-blue-600 hover:underline">
          Return to login
        </a>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;