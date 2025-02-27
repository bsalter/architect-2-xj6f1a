import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // v6.14.2
import clsx from 'clsx'; // v2.0.0
import Button from '../ui/Button';

export interface BreadcrumbsProps {
  /**
   * Array of breadcrumb items with path and label
   */
  items: Array<{path: string; label: string}>;
  
  /**
   * Optional CSS class to apply to the breadcrumb container
   */
  className?: string;
  
  /**
   * Optional custom separator between breadcrumb items
   */
  separator?: React.ReactNode;
}

/**
 * A reusable breadcrumb navigation component that displays the current location 
 * within the application hierarchy, allowing users to navigate back to parent pages.
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items,
  className,
  separator = <span className="mx-2 text-gray-400">&gt;</span> // Default chevron separator
}) => {
  // Get current location to determine active breadcrumb
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Use clsx to combine default and custom classes
  const breadcrumbClasses = clsx(
    'flex items-center py-2',
    className
  );
  
  return (
    <nav aria-label="Breadcrumb" className={breadcrumbClasses}>
      <ol className="flex items-center flex-wrap">
        {items.map((item, index) => {
          const isActive = currentPath === item.path;
          
          return (
            <li key={item.path} className="flex items-center">
              {index > 0 && separator}
              
              {isActive ? (
                <span 
                  className="text-gray-600 font-medium"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="no-underline">
                  <Button
                    variant="link"
                    className="p-0 font-normal"
                  >
                    {item.label}
                  </Button>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;