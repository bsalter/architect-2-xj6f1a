import React, { useState } from 'react';
import classNames from 'classnames'; // v2.3.2
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'; // v4.8.0
import Card from '../ui/Card';
import Button from '../ui/Button';
import AdvancedFilters from './AdvancedFilters';
import { InteractionSearchParams } from '../../types/interactions';

/**
 * Props interface for the FilterPanel component
 */
export interface FilterPanelProps {
  /**
   * The current filter parameters
   */
  filters: InteractionSearchParams;
  
  /**
   * Callback function when filters are applied
   */
  onApplyFilters: (filters: InteractionSearchParams) => void;
  
  /**
   * Callback function when filters are cleared
   */
  onClearFilters: () => void;
  
  /**
   * Additional CSS classes to apply to the component
   */
  className?: string;
  
  /**
   * Whether the panel should be initially expanded
   * @default false
   */
  initialExpanded?: boolean;
}

/**
 * A collapsible panel component that contains advanced filtering options
 * for the Interaction Finder. It provides a container for the AdvancedFilters
 * component and handles the expand/collapse behavior for showing and hiding
 * the filter interface.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onApplyFilters,
  onClearFilters,
  className = '',
  initialExpanded = false,
}) => {
  // State to track if the panel is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  
  // Toggle handler to expand/collapse the panel
  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };
  
  return (
    <Card 
      className={classNames('filter-panel', className)}
      variant="default"
    >
      {/* Card header with toggle button */}
      <div className="filter-panel-header flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-700">Advanced Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls="filter-panel-content"
        >
          {isExpanded ? (
            <>
              <FaChevronUp className="mr-2" /> Hide Filters
            </>
          ) : (
            <>
              <FaChevronDown className="mr-2" /> Show Filters
            </>
          )}
        </Button>
      </div>
      
      {/* Filter content area with animation */}
      <div 
        id="filter-panel-content"
        className={classNames(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[1000px]' : 'max-h-0'
        )}
      >
        {isExpanded && (
          <div className="p-4">
            <AdvancedFilters
              filters={filters}
              onApplyFilters={onApplyFilters}
              onClearFilters={onClearFilters}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default FilterPanel;