import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.3

export interface CardProps {
  /**
   * The content to display inside the card body
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes to apply to the card container
   */
  className?: string;
  
  /**
   * The visual style variant of the card
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  
  /**
   * Optional content to display in the card header
   */
  header?: React.ReactNode;
  
  /**
   * Optional content to display in the card footer
   */
  footer?: React.ReactNode;
  
  /**
   * Custom padding for the card body
   * @default 'p-4'
   */
  padding?: string;
  
  /**
   * Whether the card should have rounded corners
   * @default true
   */
  rounded?: boolean;
}

/**
 * A reusable card component that provides a styled container for content
 * with optional header and footer sections. Used throughout the application
 * to create consistent, visually appealing containers for various types of content.
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  header,
  footer,
  padding = 'p-4',
  rounded = true,
}) => {
  // Base classes for the card
  const cardClasses = classNames(
    'card w-full', // Base card class with full width for responsiveness
    {
      // Variant-specific styling
      'bg-white border border-gray-200': variant === 'default',
      'bg-white border border-gray-200 shadow-md': variant === 'elevated',
      'bg-transparent border border-gray-300': variant === 'outlined',
      'bg-gray-50': variant === 'flat',
      
      // Rounded corners
      'rounded-md': rounded,
      
      // Ensure proper overflow handling
      'overflow-hidden': rounded,
    },
    className // Additional custom classes for further customization
  );

  return (
    <div className={cardClasses}>
      {/* Render the header if provided */}
      {header && (
        <div className="card-header border-b border-gray-200 px-4 py-3">
          {header}
        </div>
      )}
      
      {/* Render the main content with custom padding */}
      <div className={`card-body ${padding}`}>
        {children}
      </div>
      
      {/* Render the footer if provided */}
      {footer && (
        <div className="card-footer border-t border-gray-200 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;