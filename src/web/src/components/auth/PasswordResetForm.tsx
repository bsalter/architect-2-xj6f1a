import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // v6.14.2
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { resetPassword } from '../../api/auth';
import { PasswordResetForm as PasswordResetFormData } from '../../types/auth';
import { useForm } from '../../hooks/useForm';
import { useNotification } from '../../hooks/useNotification';
import { isRequired, minLength } from '../../utils/validation';

/**
 * Props interface for the PasswordResetForm component
 */
interface PasswordResetFormProps {
  /**
   * The reset token received via email or URL
   */
  token: string;
  
  /**
   * Optional callback function to execute on successful password reset
   */
  onSuccess?: () => void;
}

/**
 * Validates password reset form fields
 * 
 * @param values - The form values to validate
 * @returns Validation errors object
 */
const validateForm = (values: PasswordResetFormData): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  
  // Validate new password
  if (!isRequired(values.newPassword)) {
    errors.newPassword = "Password is required";
  } else if (!minLength(values.newPassword, 8)) {
    errors.newPassword = "Password must be at least 8 characters";
  }
  
  // Validate password confirmation
  if (!isRequired(values.confirmPassword)) {
    errors.confirmPassword = "Please confirm your password";
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  
  return errors;
};

/**
 * A form component for resetting passwords with a valid token.
 * Allows users to enter a new password, validates it against security requirements,
 * and redirects to login on success.
 *
 * @example
 * <PasswordResetForm 
 *   token="abc123"
 *   onSuccess={() => console.log('Password reset successful')} 
 * />
 */
const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ token, onSuccess }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Initialize form state and validation
  const { 
    values, 
    errors, 
    touched, 
    handleChange, 
    handleBlur, 
    handleSubmit, 
    isSubmitting 
  } = useForm<PasswordResetFormData>(
    { token, newPassword: '', confirmPassword: '' },
    async (formData) => {
      try {
        setApiError(null);
        const response = await resetPassword(formData);
        
        if (response.success) {
          showSuccess('Your password has been successfully reset.');
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/login');
          }
        } else {
          throw new Error('Password reset failed');
        }
      } catch (error) {
        setApiError(
          error instanceof Error 
            ? error.message 
            : 'An error occurred while resetting your password. Please try again.'
        );
      }
    },
    validateForm
  );
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hidden input for token */}
      <input type="hidden" name="token" value={token} />
      
      {/* Display API errors */}
      {apiError && (
        <Alert 
          variant="error" 
          title="Password Reset Failed"
          className="mb-4"
        >
          {apiError}
        </Alert>
      )}
      
      {/* New Password Field */}
      <FormField
        label="New Password"
        error={touched.newPassword && errors.newPassword}
        required
        htmlFor="newPassword"
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="Enter your new password"
          value={values.newPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          fullWidth
        />
      </FormField>
      
      {/* Confirm Password Field */}
      <FormField
        label="Confirm Password"
        error={touched.confirmPassword && errors.confirmPassword}
        required
        htmlFor="confirmPassword"
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your new password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          fullWidth
        />
      </FormField>
      
      {/* Submit Button */}
      <div className="mt-6">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          Reset Password
        </Button>
      </div>
    </form>
  );
};

export default PasswordResetForm;