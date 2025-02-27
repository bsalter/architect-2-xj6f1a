import React from 'react';
import classNames from 'classnames'; // v2.3.2
import { FaTimes } from 'react-icons/fa'; // v4.8.0
import Button from '../ui/Button';
import { formatDateTime } from '../../utils/date';

export interface FilterTagProps {
  /**
   * The field identifier for this filter
   */
  field: string;
  
  /**
   * The current value of the filter
   */
  value: any;
  
  /**
   * The display label for the filter
   */
  label: string;
  
  /**
   * Callback function called when the remove button is clicked
   */
  onRemove: () => void;
  
  /**
   * Additional CSS classes to apply to the filter tag
   */
  className?: string;
}

/**
 * Formats the filter value based on its field type for display in the filter tag
 * 
 * @param field - The field identifier
 * @param value - The filter value to format
 * @returns Formatted value suitable for display
 */
const formatFilterValue = (field: string, value: any): string => {
  if (value === undefined || value === null) {
    return '';
  }
  
  // Format date fields
  if (field === 'startDate' || field === 'endDate') {
    return formatDateTime(value, null, 'MM/dd/yyyy');
  }
  
  // Type is already a display name
  if (field === 'type') {
    return value;
  }
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Convert to string for all other types
  return String(value);
};

/**
 * A component that displays a single filter condition as a removable tag
 * in the Finder interface. Shows the filter field name, formatted value,
 * and provides a remove button allowing users to quickly remove individual
 * filter criteria.
 */
export const FilterTag: React.FC<FilterTagProps> = ({
  field,
  value,
  label,
  onRemove,
  className = '',
}) => {
  const formattedValue = formatFilterValue(field, value);
  
  return (
    <div 
      className={classNames(
        'inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 mr-2 mb-2',
        className
      )}
      data-testid={`filter-tag-${field}`}
    >
      <span>{label}: {formattedValue}</span>
      <Button
        variant="link"
        size="sm"
        className="ml-1 text-blue-600 hover:text-blue-800"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <FaTimes />
      </Button>
    </div>
  );
};

export default FilterTag;