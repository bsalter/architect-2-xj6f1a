import { useState, useEffect, useCallback, useRef } from 'react'; // react v18.2.0
import { ValidationError } from '../types/api';
import { ValidationErrors } from '../utils/validation';
import { isValidDateRange } from '../utils/date';
import { useNotification } from './useNotification';

/**
 * Interface for form field values
 */
interface FormValues {
  [key: string]: any;
}

/**
 * Interface for tracking which form fields have been touched
 */
interface TouchedFields {
  [key: string]: boolean;
}

/**
 * Options for configuring the form behavior
 */
export interface FormOptions {
  /**
   * Whether to validate fields on change
   * @default false
   */
  validateOnChange?: boolean;
  
  /**
   * Whether to validate fields on blur
   * @default true
   */
  validateOnBlur?: boolean;
  
  /**
   * Whether to validate on form submission
   * @default true
   */
  validateOnSubmit?: boolean;
  
  /**
   * Show success notification on successful submission
   * @default true
   */
  showSuccessNotification?: boolean;
  
  /**
   * Show error notification on failed submission
   * @default true
   */
  showErrorNotification?: boolean;
  
  /**
   * Success notification message
   * @default 'Form submitted successfully'
   */
  successMessage?: string;
  
  /**
   * Error notification message
   * @default 'There was an error submitting the form'
   */
  errorMessage?: string;
}

/**
 * Custom React hook for comprehensive form state management.
 * Provides validation, submission handling, and state tracking for forms,
 * with special support for interaction form validation.
 *
 * @param initialValues - Initial values for the form fields
 * @param onSubmit - Function to call when the form is submitted and validation passes
 * @param validateForm - Custom form validation function
 * @param options - Additional options for form behavior
 * @returns Object containing form state and methods for form manipulation
 * 
 * @example
 * // Basic usage
 * const { values, handleChange, handleSubmit } = useForm(
 *   { name: '', email: '' },
 *   async (values) => {
 *     await saveData(values);
 *   }
 * );
 * 
 * @example
 * // With validation
 * const { 
 *   values, 
 *   errors, 
 *   touched, 
 *   handleChange, 
 *   handleBlur, 
 *   handleSubmit 
 * } = useForm(
 *   { title: '', startDateTime: '' },
 *   saveInteraction,
 *   validateInteractionForm
 * );
 */
export const useForm = <T extends FormValues>(
  initialValues: T = {} as T,
  onSubmit?: (values: T) => Promise<void> | void,
  validateForm?: (values: T) => ValidationErrors,
  options: FormOptions = {}
) => {
  // Default options
  const defaultOptions: FormOptions = {
    validateOnChange: false,
    validateOnBlur: true,
    validateOnSubmit: true,
    showSuccessNotification: true,
    showErrorNotification: true,
    successMessage: 'Form submitted successfully',
    errorMessage: 'There was an error submitting the form'
  };
  
  // Merge provided options with defaults
  const formOptions = { ...defaultOptions, ...options };
  
  // Store initial values in a ref to compare for dirty state
  const initialValuesRef = useRef<T>(initialValues);
  
  // Form state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  
  // Access notification functions
  const { showSuccess, showError } = useNotification();
  
  // Check if the form is valid
  const isValid = Object.keys(errors).length === 0;
  
  /**
   * Check if form values differ from initial values to determine dirty state
   */
  useEffect(() => {
    // Helper to check deep equality
    const isEqual = (obj1: any, obj2: any): boolean => {
      if (obj1 === obj2) return true;
      
      if (
        typeof obj1 !== 'object' ||
        typeof obj2 !== 'object' ||
        obj1 === null ||
        obj2 === null
      ) {
        return obj1 === obj2;
      }
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!isEqual(obj1[key], obj2[key])) return false;
      }
      
      return true;
    };
    
    setIsDirty(!isEqual(values, initialValuesRef.current));
  }, [values]);
  
  /**
   * Validates a single field and returns any error message
   *
   * @param name - Field name to validate
   * @param value - Field value to validate
   * @returns Error message if validation fails, undefined if it passes
   */
  const validateField = useCallback(
    (name: string, value: any): string | undefined => {
      // Return immediately if no validateForm function is provided
      if (!validateForm) return undefined;
      
      // Create a temporary copy of the current values
      const tempValues = { ...values, [name]: value };
      
      // Run the validateForm function
      const validationErrors = validateForm(tempValues);
      
      // Return the specific error for this field if it exists
      return validationErrors[name];
    },
    [validateForm, values]
  );
  
  /**
   * Validates the entire form
   *
   * @returns Object containing validation errors
   */
  const runValidation = useCallback((): ValidationErrors => {
    if (!validateForm) return {};
    return validateForm(values);
  }, [validateForm, values]);
  
  /**
   * Updates form values when a field changes
   *
   * @param e - Change event from input element
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let fieldValue: any = value;
      
      // Handle different input types
      if (type === 'checkbox') {
        fieldValue = (e.target as HTMLInputElement).checked;
      } else if (type === 'number') {
        fieldValue = parseFloat(value) || value;
      }
      
      // Update the values
      setValues((prevValues) => ({
        ...prevValues,
        [name]: fieldValue,
      }));
      
      // Validate field if validateOnChange is enabled
      if (formOptions.validateOnChange) {
        const fieldError = validateField(name, fieldValue);
        
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: fieldError,
        }));
      }
      
      // Mark field as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));
    },
    [formOptions.validateOnChange, validateField]
  );
  
  /**
   * Handles blur events on form fields to trigger validation
   *
   * @param e - Blur event from input element
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      
      // Mark the field as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));
      
      // Validate field if validateOnBlur is enabled
      if (formOptions.validateOnBlur) {
        const fieldError = validateField(name, value);
        
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: fieldError,
        }));
      }
    },
    [formOptions.validateOnBlur, validateField]
  );
  
  /**
   * Programmatically sets the value of a form field
   *
   * @param name - Field name to set
   * @param value - Value to set for the field
   * @param shouldValidate - Whether to validate the field after setting
   */
  const setFieldValue = useCallback(
    (name: string, value: any, shouldValidate: boolean = formOptions.validateOnChange) => {
      // Update the value
      setValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
      
      // Validate if requested
      if (shouldValidate) {
        const fieldError = validateField(name, value);
        
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: fieldError,
        }));
      }
      
      // Mark as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));
    },
    [formOptions.validateOnChange, validateField]
  );
  
  /**
   * Manually sets an error message for a field
   *
   * @param name - Field name
   * @param error - Error message
   */
  const setFieldError = useCallback((name: string, error?: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  }, []);
  
  /**
   * Handles form submission
   *
   * @param e - Form submit event
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      // Prevent default browser form submission if event is provided
      if (e) {
        e.preventDefault();
      }
      
      // Increment submit count
      setSubmitCount((prev) => prev + 1);
      
      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (touched, key) => ({ ...touched, [key]: true }),
        {}
      );
      setTouched(allTouched);
      
      // Validate form before submission if validateOnSubmit is enabled
      let formErrors = {};
      if (formOptions.validateOnSubmit && validateForm) {
        formErrors = validateForm(values);
        setErrors(formErrors);
      }
      
      // Check if there are validation errors
      if (Object.keys(formErrors).length > 0) {
        if (formOptions.showErrorNotification) {
          showError('Please correct the errors before submitting.');
        }
        return;
      }
      
      // If there's no onSubmit handler, just return
      if (!onSubmit) return;
      
      // Set submitting state
      setIsSubmitting(true);
      
      try {
        // Call the onSubmit handler
        await onSubmit(values);
        
        // Show success notification if enabled
        if (formOptions.showSuccessNotification) {
          showSuccess(formOptions.successMessage || 'Form submitted successfully');
        }
      } catch (error) {
        // Handle API validation errors if they follow the expected format
        if (error && typeof error === 'object' && 'details' in error) {
          const apiErrors = (error as { details: ValidationError[] }).details;
          
          if (Array.isArray(apiErrors)) {
            // Convert API validation errors to our format
            const formattedErrors = apiErrors.reduce(
              (acc, curr) => ({ ...acc, [curr.field]: curr.message }),
              {}
            );
            
            setErrors(formattedErrors);
          }
        }
        
        // Show error notification if enabled
        if (formOptions.showErrorNotification) {
          showError(
            formOptions.errorMessage || 
            (error instanceof Error ? error.message : 'There was an error submitting the form')
          );
        }
      } finally {
        // Reset submitting state
        setIsSubmitting(false);
      }
    },
    [
      values,
      onSubmit,
      validateForm,
      formOptions.validateOnSubmit,
      formOptions.showErrorNotification,
      formOptions.showSuccessNotification,
      formOptions.successMessage,
      formOptions.errorMessage,
      showError,
      showSuccess,
    ]
  );
  
  /**
   * Resets the form to initial values or empty state
   *
   * @param newValues - New values to set, or reset to initial values if not provided
   */
  const resetForm = useCallback(
    (newValues?: Partial<T>) => {
      const resetValues = newValues
        ? { ...initialValuesRef.current, ...newValues }
        : initialValuesRef.current;
      
      setValues(resetValues as T);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setIsDirty(false);
    },
    []
  );
  
  /**
   * Updates initialValues if they change
   */
  useEffect(() => {
    initialValuesRef.current = initialValues;
    // Don't reset values here to avoid clearing user input when parent re-renders
  }, [initialValues]);
  
  // Return all form state and methods
  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    submitCount,
    
    // Form handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Form manipulation
    setFieldValue,
    setFieldError,
    resetForm,
    
    // Validation
    validateField,
    validateForm: runValidation,
  };
};

export default useForm;