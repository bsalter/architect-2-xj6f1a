import React, { FC } from 'react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
  canCreateInteraction: boolean;
}

/**
 * EmptyState component that displays when no interactions are found in the Finder view.
 * Shows different messages and action buttons depending on whether filters are applied
 * and user permissions.
 */
const EmptyState: FC<EmptyStateProps> = ({ 
  hasFilters, 
  onClearFilters, 
  onCreateNew, 
  canCreateInteraction 
}) => {
  // Determine the appropriate message based on whether filters are applied
  const message = hasFilters 
    ? 'No interactions match your search criteria'
    : 'No interactions found';

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {/* Empty state icon */}
      <div className="mb-4 p-4 rounded-full bg-gray-100">
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {hasFilters ? (
            // Search-related icon when filters are applied
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          ) : (
            // Document-related icon when no interactions exist
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          )}
        </svg>
      </div>
      
      {/* Message */}
      <h3 className="mb-2 text-lg font-medium text-gray-900">{message}</h3>
      <p className="mb-6 text-gray-500">
        {hasFilters 
          ? 'Try adjusting your filters or creating a new interaction'
          : 'Get started by creating your first interaction'
        }
      </p>
      
      {/* Action buttons */}
      <div className="flex space-x-4">
        {hasFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            data-testid="clear-filters-button"
          >
            Clear Filters
          </Button>
        )}
        
        {canCreateInteraction && (
          <Button 
            variant="primary" 
            onClick={onCreateNew}
            data-testid="create-interaction-button"
            leftIcon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            }
          >
            Create New Interaction
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;