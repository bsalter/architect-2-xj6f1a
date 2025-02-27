import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2

interface HelperTextProps {
  /**
   * Type of helper text that determines the visual styling
   * @default 'info'
   */
  type?: 'error' | 'warning' | 'info' | 'success';
  
  /**
   * Content to be displayed within the helper text
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
  
  /**
   * ID for the helper text element, used for associating with form elements via aria-describedby
   */
  id?: string;
}

/**
 * HelperText is a reusable component that provides contextual feedback 
 * messages for form fields and other UI elements.
 * It supports different visual states for information, errors, warnings, or success messages.
 */
const HelperText: React.FC<HelperTextProps> = ({
  type = 'info',
  children,
  className,
  id,
}) => {
  // Determine the appropriate text color based on the type
  const classes = classNames(
    'text-sm mt-1',
    {
      'text-red-600': type === 'error',
      'text-amber-600': type === 'warning',
      'text-blue-600': type === 'info',
      'text-green-600': type === 'success',
    },
    className
  );

  return (
    <p 
      className={classes}
      id={id}
      // Use aria-live to announce changes for screen readers, particularly important for errors
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </p>
  );
};

export default HelperText;