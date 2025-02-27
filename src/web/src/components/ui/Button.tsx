import React, { ReactNode } from 'react';
import classNames from 'classnames'; // v2.3.2
import Spinner from './Spinner';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'link';

// Button size types
export type ButtonSize = 'sm' | 'md' | 'lg';

// Button props interface
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * The size of the button
   * @default 'md'
   */
  size?: ButtonSize;
  
  /**
   * If true, shows a loading spinner and disables the button
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Icon to display before the button text
   */
  leftIcon?: ReactNode;
  
  /**
   * Icon to display after the button text
   */
  rightIcon?: ReactNode;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * The content of the button
   */
  children: ReactNode;
}

/**
 * A reusable button component that provides consistent styling and behavior
 * across the application, supporting various variants, sizes, and states.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  ...rest
}) => {
  // Generate button classes based on variant
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    link: 'bg-transparent text-blue-600 hover:text-blue-800 hover:underline p-0 focus:ring-blue-500'
  }[variant];

  // Generate button size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }[size];

  // Combine all classes
  const buttonClasses = classNames(
    'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
    variantClasses,
    sizeClasses,
    variant !== 'link' && 'inline-flex items-center justify-center',
    (disabled || isLoading) && 'opacity-70 cursor-not-allowed',
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      type={rest.type || 'button'} // Default to 'button' to avoid accidental form submissions
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center">
          <Spinner 
            size="sm" 
            color={variant === 'outline' || variant === 'secondary' || variant === 'link' ? 'primary' : 'white'} 
            className="mr-2" 
          />
          {children}
        </span>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;