import React from 'react';
import classNames from 'classnames'; // v2.3.2

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

/**
 * Badge component that provides visual indicators for statuses, categories, or counts
 * Use to highlight information such as interaction types, statuses, or filter tags
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  // Base classes that all badges share
  const baseClasses = 'inline-block rounded-full font-medium';

  // Variant-specific classes for colors (background, text, border)
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  };

  // Size-specific classes for padding and text size
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  // Combine all classes: base + variant + size + any custom classes
  const badgeClasses = classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};

export default Badge;