import React from 'react'; // react v18.2.0
import { Helmet } from 'react-helmet-async'; // v7.0.0
import AuthLayout from '../components/layout/AuthLayout';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

/**
 * Page component that renders the forgot password form within the authentication layout
 * Provides a self-contained forgot password experience with appropriate feedback and navigation options.
 */
const ForgotPassword: React.FC = () => {
  return (
    <AuthLayout>
      <Helmet>
        <title>Forgot Password | Interaction Management</title>
        <meta name="description" content="Request a password reset for your Interaction Management account" />
      </Helmet>
      
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Forgot Password
      </h1>
      
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPassword;