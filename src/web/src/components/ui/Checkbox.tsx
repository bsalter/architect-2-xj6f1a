import React, { forwardRef } from 'react'; // react@18.2.0
import classNames from 'classnames'; // classnames@2.3.2

/**
 * Props for the Checkbox component
 */
export interface CheckboxProps {
  /** Unique identifier for the checkbox input */
  id?: string;
  /** Name attribute for the checkbox input */
  name: string;
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Callback function when the checkbox state changes */
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Label text to display next to the checkbox */
  label: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Error message to display when validation fails */
  error?: string;
  /** Additional CSS class for the checkbox container */
  className?: string;
  /** Additional CSS class for the label */
  labelClassName?: string;
}

/**
 * A reusable checkbox component that provides consistent styling and behavior.
 * Supports checked, unchecked, disabled, and error states.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      name,
      checked = false,
      onChange,
      label,
      disabled = false,
      error,
      className = '',
      labelClassName = '',
    },
    ref
  ) => {
    // Generate a unique ID if none is provided
    const checkboxId = id || `checkbox-${name}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine the appropriate class names based on component state
    const containerClasses = classNames(
      'flex items-start gap-2',
      {
        'opacity-50 cursor-not-allowed': disabled,
      },
      className
    );

    const checkboxClasses = classNames(
      'relative w-5 h-5 border rounded focus:ring-2 focus:ring-primary-300 focus:outline-none',
      {
        'bg-primary-600 border-primary-600': checked,
        'bg-white border-gray-300': !checked,
        'border-red-500': error,
        'cursor-pointer': !disabled,
        'cursor-not-allowed': disabled,
      }
    );

    const labelClasses = classNames(
      'text-sm font-medium text-gray-700 select-none',
      {
        'cursor-pointer': !disabled,
        'cursor-not-allowed': disabled,
        'text-red-500': error,
      },
      labelClassName
    );

    // Handle checkbox change event
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange(e);
      }
    };

    return (
      <div className={containerClasses}>
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only" // Hide the actual input element
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
          />
          <div className={checkboxClasses}>
            {checked && (
              <svg
                className="absolute inset-0 w-5 h-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <label htmlFor={checkboxId} className={labelClasses}>
            {label}
          </label>
        </div>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

// Display name for debugging
Checkbox.displayName = 'Checkbox';