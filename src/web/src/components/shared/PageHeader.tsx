import React from 'react'; // v18.2.0
import clsx from 'clsx'; // v2.0.0
import Breadcrumbs from './Breadcrumbs';
import Button from '../ui/Button';

/**
 * Props interface for PageHeader component
 */
export interface PageHeaderProps {
  /**
   * The title to display in the page header
   */
  title: string;
  
  /**
   * Optional breadcrumbs for navigation context
   */
  breadcrumbs?: Array<{path: string; label: string}>;
  
  /**
   * Optional action buttons to display in the header
   */
  actions?: React.ReactNode;
  
  /**
   * Optional back button configuration
   */
  backButton?: { 
    path: string; 
    label?: string;
  };
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * A reusable page header component that provides consistent page titles,
 * navigation breadcrumbs, and action buttons across the application.
 * 
 * This component enhances UI consistency and improves navigation by
 * providing clear context of where the user is within the application.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbs,
  actions,
  backButton,
  className,
}) => {
  // Combine default and custom classes using clsx
  const headerClasses = clsx(
    'mb-6 pb-4 border-b border-gray-200',
    className
  );

  return (
    <header className={headerClasses} data-testid="page-header">
      {/* Breadcrumbs navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}
      
      <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div className="flex items-center">
          {/* Back button */}
          {backButton && (
            <div className="mr-4">
              <Button 
                variant="outline" 
                size="sm"
                leftIcon={<span aria-hidden="true">&larr;</span>}
                onClick={() => {
                  window.location.href = backButton.path;
                }}
                aria-label={`Back to ${backButton.label || 'previous page'}`}
              >
                {backButton.label || 'Back'}
              </Button>
            </div>
          )}
          
          {/* Page title */}
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mt-2 sm:mt-0">
            {title}
          </h1>
        </div>
        
        {/* Action buttons */}
        {actions && (
          <div className="flex space-x-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;