import React from 'react';
import classNames from 'classnames'; // v2.3.3

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | string;
  
  /**
   * The color of the spinner
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'white' | string;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * Optional label to display with the spinner
   */
  label?: string;
}

/**
 * A customizable loading spinner component for indicating loading states
 * throughout the application.
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label,
  ...rest
}) => {
  // Determine size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }[size] || size; // Use the predefined sizes or the custom string value

  // Determine color classes
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600', 
    white: 'text-white',
  }[color] || color; // Use the predefined colors or the custom string value

  // Build spinner classes
  const spinnerClasses = classNames(
    'inline-block animate-spin rounded-full border-current border-solid border-r-transparent border-2',
    sizeClasses,
    colorClasses,
    className
  );

  return (
    <div className="flex items-center justify-center" role="status" aria-live="polite" {...rest}>
      <div className={spinnerClasses}></div>
      {label && <span className="ml-3">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;