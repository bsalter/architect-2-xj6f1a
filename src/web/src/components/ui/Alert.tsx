import React from 'react';
import classNames from 'classnames'; // v2.3.2
import { 
  CheckIcon, 
  ErrorIcon, 
  AlertIcon, 
  InfoIcon, 
  CloseIcon 
} from '../../assets/icons';

// Type for alert variants
export type AlertVariantType = 'success' | 'error' | 'warning' | 'info';

// Alert component props
export interface AlertProps {
  /**
   * The type of alert
   * @default 'info'
   */
  variant?: AlertVariantType;
  
  /**
   * The content of the alert
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;
  
  /**
   * Function to call when the alert is dismissed
   * Required if dismissible is true
   */
  onDismiss?: () => void;
  
  /**
   * Custom icon to override the default
   */
  icon?: React.ReactNode;
  
  /**
   * Optional title for the alert
   */
  title?: string;
}

/**
 * Gets the CSS classes for the alert based on its variant
 * 
 * @param variant - The alert variant
 * @returns Object containing CSS class mappings for different parts of the alert
 */
const getAlertStyles = (variant: string) => {
  // Base styles for all alerts
  const baseStyles = 'p-4 rounded-md flex items-start';
  
  // Variant-specific styles
  const variantStyles = {
    success: 'bg-green-50 text-green-800 border border-green-100',
    error: 'bg-red-50 text-red-800 border border-red-100',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-100',
    info: 'bg-blue-50 text-blue-800 border border-blue-100'
  };
  
  // Icon container styles
  const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };
  
  // Make sure we have a valid variant, defaulting to info if not recognized
  const safeVariant = Object.keys(variantStyles).includes(variant) ? variant : 'info';
  
  return {
    container: classNames(baseStyles, variantStyles[safeVariant]),
    icon: classNames('flex-shrink-0 w-5 h-5 mr-3', iconStyles[safeVariant]),
    content: 'flex-1',
    title: 'font-medium mb-1',
    closeButton: 'ml-3 -mt-1 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md'
  };
};

/**
 * Gets the appropriate icon for the alert variant
 * 
 * @param variant - The alert variant
 * @returns React node containing the icon component
 */
const getAlertIcon = (variant: string): React.ReactNode => {
  switch (variant) {
    case 'success':
      return <CheckIcon className="w-5 h-5" />;
    case 'error':
      return <ErrorIcon className="w-5 h-5" />;
    case 'warning':
      return <AlertIcon className="w-5 h-5" />;
    case 'info':
    default:
      return <InfoIcon className="w-5 h-5" />;
  }
};

/**
 * Alert component for displaying feedback, warnings, errors or information messages to users.
 * 
 * @example
 * // Success alert
 * <Alert variant="success">Operation completed successfully</Alert>
 * 
 * @example
 * // Error alert with title and dismiss button
 * <Alert 
 *   variant="error" 
 *   title="Form Submission Failed" 
 *   dismissible 
 *   onDismiss={() => setShowError(false)}
 * >
 *   Please check your input and try again
 * </Alert>
 */
const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className,
  dismissible = false,
  onDismiss,
  icon,
  title
}) => {
  // Validate that if dismissible is true, onDismiss is provided
  if (process.env.NODE_ENV !== 'production') {
    if (dismissible && !onDismiss) {
      console.warn('Alert: onDismiss prop is required when dismissible is true');
    }
  }
  
  const styles = getAlertStyles(variant);
  const defaultIcon = icon || getAlertIcon(variant);
  
  return (
    <div 
      className={classNames(styles.container, className)}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className={styles.icon}>
        {defaultIcon}
      </div>
      
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <div>{children}</div>
      </div>
      
      {dismissible && onDismiss && (
        <button 
          type="button" 
          onClick={onDismiss} 
          className={styles.closeButton}
          aria-label="Dismiss"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;