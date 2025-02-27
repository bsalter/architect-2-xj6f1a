import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2
import { HelperText } from '../shared/HelperText';

interface TextAreaProps {
  id?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helperText?: string;
  rows?: number;
  className?: string;
  required?: boolean;
  maxLength?: number;
  'data-testid'?: string;
}

/**
 * A functional component that renders an enhanced textarea with validation support,
 * accessibility features, and styling customization for multi-line text input.
 * Used primarily for description and notes fields in the Interaction form.
 */
const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  rows = 4,
  className,
  required = false,
  maxLength,
  'data-testid': dataTestId,
}) => {
  // Generate a unique ID for the textarea if not provided
  const textareaId = id || `textarea-${name}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Generate a unique ID for the helper/error text for aria-describedby
  const helperTextId = `${textareaId}-helper`;
  
  // Construct CSS classes based on component state
  const textareaClasses = classNames(
    'w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2',
    {
      'bg-gray-100 text-gray-500 cursor-not-allowed': disabled,
      'border-red-500 focus:border-red-500 focus:ring-red-200': error,
      'border-gray-300 focus:border-blue-500 focus:ring-blue-200': !error && !disabled,
    },
    className
  );

  return (
    <div className="w-full">
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        className={textareaClasses}
        required={required}
        maxLength={maxLength}
        data-testid={dataTestId}
        aria-invalid={!!error}
        aria-describedby={(error || helperText) ? helperTextId : undefined}
      />
      
      {(error || helperText) && (
        <HelperText
          id={helperTextId}
          type={error ? 'error' : 'info'}
        >
          {error || helperText}
        </HelperText>
      )}
    </div>
  );
};

export default TextArea;