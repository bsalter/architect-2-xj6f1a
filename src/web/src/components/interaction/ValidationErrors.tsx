import React from 'react';
import classNames from 'classnames'; // v2.3.2
import Alert from '../ui/Alert';
import { ValidationError } from '../../types/api';

interface ValidationErrorsProps {
  errors?: ValidationError[] | Record<string, string> | string[] | null;
  className?: string;
}

/**
 * Converts various error formats into a consistent structure
 * 
 * @param errors - Validation errors in various formats
 * @returns An array of formatted error messages
 */
const normalizeErrors = (
  errors?: ValidationError[] | Record<string, string> | string[] | null
): string[] => {
  // Check if errors is null or undefined, return empty array if so
  if (!errors) return [];

  // Check the type of errors input
  // If it's a string array, return as is
  if (Array.isArray(errors) && errors.length > 0 && typeof errors[0] === 'string') {
    return errors as string[];
  }

  // If it's an object with field:message pairs, convert to array of 'Field: Message' strings
  if (!Array.isArray(errors) && typeof errors === 'object') {
    return Object.entries(errors).map(([field, message]) => {
      // Capitalize field name and format nicely
      const formattedField = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
      return `${formattedField}: ${message}`;
    });
  }

  // If it's an array of ValidationError objects, extract and format the messages as 'Field: Message'
  if (Array.isArray(errors) && errors.length > 0 && 
      typeof errors[0] === 'object' && 'field' in errors[0] && 'message' in errors[0]) {
    return (errors as ValidationError[]).map(err => {
      // Capitalize field name and format nicely
      const formattedField = err.field.charAt(0).toUpperCase() + err.field.slice(1).replace(/([A-Z])/g, ' $1');
      return `${formattedField}: ${err.message}`;
    });
  }

  // Return the normalized array of error messages
  return [];
};

/**
 * A component that displays validation errors for the interaction form
 */
const ValidationErrors: React.FC<ValidationErrorsProps> = ({ errors, className }) => {
  // Destructure props to get errors and className
  const normalizedErrors = normalizeErrors(errors);

  // If there are no errors after normalization, return null
  if (normalizedErrors.length === 0) {
    return null;
  }

  // Render a container div with the className prop applied if provided
  return (
    <div 
      className={classNames('validation-errors mb-4', className)}
      aria-live="polite"
      role="alert"
    >
      {/* For each error message, render an Alert component with 'error' variant */}
      {normalizedErrors.map((error, index) => (
        <Alert 
          key={index} 
          variant="error" 
          className="mb-2"
        >
          {error}
        </Alert>
      ))}
    </div>
  );
};

export default ValidationErrors;