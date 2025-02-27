import React, { useState } from 'react'; // react v18.2.0
import { Link } from 'react-router-dom'; // v6.14.2
import { useForm } from 'react-hook-form'; // v7.45.1
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Spinner } from '../ui/Spinner';
import { useNotification } from '../../hooks/useNotification';
import { forgotPassword } from '../../api/auth';
import { isValidEmail } from '../../utils/validation';

/**
 * Form input data interface
 */
interface ForgotPasswordFormData {
  email: string;
}

/**
 * ForgotPasswordForm component that provides a form for users to request a password reset
 */
const ForgotPasswordForm: React.FC = () => {
  // Form state with validation
  const { register, handleSubmit: validateSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: ''
    }
  });

  // State for handling form submission
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hook for showing notifications
  const { showSuccess, showError } = useNotification();

  /**
   * Handles form submission and password reset request
   * @param data Form data containing email
   */
  const handleSubmit = async (data: ForgotPasswordFormData) => {
    // Clear previous messages
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Call API to request password reset
      const response = await forgotPassword({ email: data.email });

      if (response.success) {
        // Show success message
        setSuccessMessage(
          'Password reset instructions have been sent to your email. Please check your inbox.'
        );
        showSuccess('Password reset email sent successfully');
      } else {
        // Shouldn't reach here based on API structure, but just in case
        setErrorMessage('Failed to send password reset email. Please try again.');
        showError('Failed to send password reset email');
      }
    } catch (error) {
      // Handle API error
      const errorMsg = 'An error occurred while processing your request. Please try again later.';
      setErrorMessage(errorMsg);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Forgot Your Password?
      </h2>
      
      <p className="mb-6 text-gray-600 text-center">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {/* Success message */}
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      {/* Error message */}
      {errorMessage && (
        <Alert variant="error" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={validateSubmit(handleSubmit)} className="space-y-6">
        <FormField 
          label="Email" 
          error={errors.email?.message} 
          required
          htmlFor="email"
        >
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            fullWidth
            {...register('email', {
              required: 'Email is required',
              validate: (value) => isValidEmail(value) || 'Please enter a valid email address'
            })}
          />
        </FormField>

        <div className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            isLoading={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" color="white" className="mr-2" />
                Sending...
              </>
            ) : 'Reset Password'}
          </Button>

          <div className="text-center mt-4">
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;