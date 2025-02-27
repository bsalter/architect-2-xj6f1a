import React, { forwardRef } from 'react'; // react version: ^18.2.0
import classNames from 'classnames'; // classnames version: ^2.3.2

/**
 * Interface defining the props for the Input component
 */
export interface InputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * A customizable input component with support for validation states and different input types
 */
const Input = forwardRef<HTMLInputElement, InputProps & React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    const {
      id,
      name,
      placeholder,
      className,
      error,
      type = 'text',
      disabled = false,
      required = false,
      fullWidth = false,
      readOnly = false,
      onChange,
      onBlur,
      onFocus,
      ...rest
    } = props;

    // Compose CSS classes using classNames utility
    const inputClasses = classNames(
      'form-input',
      {
        'w-full': fullWidth,
        'form-input--error': !!error,
        'form-input--disabled': disabled,
        'form-input--readonly': readOnly,
      },
      className
    );

    return (
      <div className={fullWidth ? 'form-field w-full' : 'form-field'}>
        <input
          id={id}
          name={name}
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly={readOnly}
          className={inputClasses}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          aria-invalid={!!error}
          {...rest}
        />
        {error && (
          <div className="form-error-message" aria-live="polite">{error}</div>
        )}
      </div>
    );
  }
);

// Set display name for better debugging in React DevTools
Input.displayName = 'Input';

export default Input;