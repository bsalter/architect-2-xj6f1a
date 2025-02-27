import React, { forwardRef, SelectHTMLAttributes, ReactNode, ChangeEvent, ForwardedRef } from 'react';
import classNames from 'classnames'; // v2.3.2

/**
 * Props for the Select component
 * @extends SelectHTMLAttributes<HTMLSelectElement>
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Unique identifier for the select element */
  id: string;
  /** Name attribute for the select element */
  name: string;
  /** Additional class names to apply to the select element */
  className?: string;
  /** Placeholder text to display when no option is selected */
  placeholder?: string;
  /** Whether the select has an error state */
  isError?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the select is required */
  required?: boolean;
  /** Callback fired when the select value changes */
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  /** Child elements (options) */
  children: ReactNode;
}

/**
 * Interface for option items in the select
 */
export interface SelectOption {
  /** Value of the option */
  value: string;
  /** Display label of the option */
  label: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

/**
 * A customizable select dropdown component with support for different states and styling.
 * 
 * @example
 * <Select
 *   id="type"
 *   name="type"
 *   placeholder="Select a type"
 *   isError={!!errors.type}
 *   aria-describedby={errors.type ? 'type-error' : undefined}
 *   required
 * >
 *   <option value="meeting">Meeting</option>
 *   <option value="call">Call</option>
 *   <option value="email">Email</option>
 * </Select>
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id,
      name,
      className = '',
      placeholder,
      isError = false,
      disabled = false,
      required = false,
      onChange,
      children,
      ...rest
    },
    ref
  ) => {
    // Generate class names based on component state
    const selectClasses = classNames(
      // Base styles
      'block w-full px-3 py-2 border rounded-md shadow-sm text-sm',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
      // Conditional styles based on state
      {
        'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500': isError,
        'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500': !isError && !disabled,
        'bg-gray-100 text-gray-500 cursor-not-allowed': disabled,
      },
      // Additional classes passed via props
      className
    );

    // Handle the select change event
    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <select
        id={id}
        name={name}
        ref={ref}
        className={selectClasses}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        aria-invalid={isError}
        aria-required={required}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    );
  }
);

// Set display name for better debugging experience
Select.displayName = 'Select';

export default Select;