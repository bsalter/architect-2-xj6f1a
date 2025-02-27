import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2
import HelperText from '../shared/HelperText';

/**
 * Props for the FormField component
 */
export interface FormFieldProps {
  /**
   * Label text for the form field
   */
  label: string;
  
  /**
   * Form control(s) to be rendered within the field
   */
  children: React.ReactNode;
  
  /**
   * Error message to display if validation fails
   */
  error?: string;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Additional CSS classes to apply to the field container
   */
  className?: string;
  
  /**
   * Help text to display below the field
   */
  helpText?: string;
  
  /**
   * ID of the form input for associating the label
   */
  htmlFor?: string;
}

/**
 * A reusable form field component that provides consistent layout, labeling,
 * error display, and accessibility features for form controls.
 * 
 * It serves as a container that wraps input elements with proper labeling
 * and validation feedback.
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required = false,
  className,
  helpText,
  htmlFor,
}) => {
  // Combine base styles with additional classes
  const fieldClasses = classNames(
    'mb-4', // Base margin
    {
      'has-error': !!error, // For potential additional styling when there's an error
    },
    className
  );

  return (
    <div className={fieldClasses}>
      {/* Label with required indicator if needed */}
      <label 
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      
      {/* Form control(s) */}
      <div className="mt-1">
        {children}
      </div>
      
      {/* Error message */}
      {error && (
        <HelperText type="error">
          {error}
        </HelperText>
      )}
      
      {/* Help text (only shown if no error and helpText is provided) */}
      {!error && helpText && (
        <HelperText type="info">
          {helpText}
        </HelperText>
      )}
    </div>
  );
};

export default FormField;