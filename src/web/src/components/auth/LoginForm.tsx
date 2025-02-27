import React, { useEffect } from 'react'; // react v18.2.0
import { Link } from 'react-router-dom'; // react-router-dom ^6.0.0
import useAuth from '../../hooks/useAuth';
import { LoginCredentials } from '../../types/auth';
import useForm from '../../hooks/useForm';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Alert from '../ui/Alert';

/**
 * Props interface for the LoginForm component
 */
export interface LoginFormProps {
  /**
   * Callback function executed on successful login
   */
  onSuccess: () => void;
  
  /**
   * Optional redirect path for the 'Forgot Password' link
   */
  redirectPath?: string;
}

/**
 * Validates the login form input fields
 * 
 * @param values - The form values to validate
 * @returns Object containing validation error messages
 */
const validateLoginForm = (values: LoginCredentials) => {
  const errors: Record<string, string> = {};
  
  // Validate username is not empty
  if (!values.username?.trim()) {
    errors.username = 'Username is required';
  }
  
  // Validate password is not empty
  if (!values.password) {
    errors.password = 'Password is required';
  }
  
  return errors;
};

/**
 * Component that renders a login form with username and password fields
 * 
 * This component handles user authentication, providing input fields for
 * username and password with validation, error handling, and loading state feedback.
 * 
 * @param props - Component props
 * @returns Login form component
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectPath }) => {
  // Access authentication context using useAuth hook
  const { login, error: authError, clearError } = useAuth();
  
  // Initialize form state with useForm hook
  const { 
    values, 
    errors, 
    handleChange, 
    handleSubmit, 
    isSubmitting 
  } = useForm<LoginCredentials>(
    { username: '', password: '' },
    handleLogin,
    validateLoginForm
  );
  
  /**
   * Handle login form submission
   * 
   * @param formData - The login credentials from the form
   */
  async function handleLogin(formData: LoginCredentials) {
    try {
      await login(formData);
      onSuccess();
    } catch (error) {
      // Error handling is managed by useAuth and displayed in the UI
    }
  }
  
  // Clear global auth error when form fields change
  useEffect(() => {
    if (authError && (values.username || values.password)) {
      clearError();
    }
  }, [values, authError, clearError]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display error alert if authentication error occurs */}
      {authError && (
        <Alert 
          variant="error" 
          className="mb-4"
        >
          {authError}
        </Alert>
      )}
      
      {/* Username field */}
      <FormField
        label="Username"
        htmlFor="username"
        error={errors.username}
        required
      >
        <Input
          id="username"
          name="username"
          type="text"
          value={values.username}
          onChange={handleChange}
          placeholder="Enter your username"
          required
          fullWidth
          autoComplete="username"
        />
      </FormField>
      
      {/* Password field */}
      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password}
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          fullWidth
          autoComplete="current-password"
        />
      </FormField>
      
      {/* Form actions */}
      <div className="flex items-center justify-between mt-6">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Log In
        </Button>
        
        <Link
          to={redirectPath ?? "/forgot-password"}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Forgot Password?
        </Link>
      </div>
    </form>
  );
};

export default LoginForm;