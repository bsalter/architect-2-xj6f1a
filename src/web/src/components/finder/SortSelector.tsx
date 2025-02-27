import React, { useState, useEffect } from 'react';
import classNames from 'classnames'; // v2.3.2
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { SortDirection, InteractionSortField } from '../../types/interactions';

/**
 * Props for the SortSelector component
 */
interface SortSelectorProps {
  /** Currently selected field to sort by */
  field: string;
  /** Current sort direction */
  direction: SortDirection;
  /** Callback when sort configuration changes */
  onSortChange: (field: string, direction: SortDirection) => void;
  /** Available fields that can be sorted */
  availableFields: string[];
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * Component for selecting sort field and direction in the Interaction Finder
 * Allows users to choose which field to sort by and specify the sort direction.
 */
const SortSelector: React.FC<SortSelectorProps> = ({
  field,
  direction,
  onSortChange,
  availableFields,
  disabled = false,
}) => {
  // Local state for selected values
  const [selectedField, setSelectedField] = useState<string>(field);
  const [selectedDirection, setSelectedDirection] = useState<SortDirection>(direction);

  // Update local state when props change
  useEffect(() => {
    setSelectedField(field);
    setSelectedDirection(direction);
  }, [field, direction]);

  /**
   * Handle change of the sort field
   */
  const handleFieldChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedField(event.target.value);
  };

  /**
   * Handle change of the sort direction
   */
  const handleDirectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDirection(event.target.value as SortDirection);
  };

  /**
   * Apply the current sort selections
   */
  const handleApplySort = () => {
    onSortChange(selectedField, selectedDirection);
  };

  /**
   * Reset sort to default values
   */
  const handleResetSort = () => {
    const defaultField = InteractionSortField.CREATED_AT;
    const defaultDirection = SortDirection.DESC;
    
    setSelectedField(defaultField);
    setSelectedDirection(defaultDirection);
    onSortChange(defaultField, defaultDirection);
  };

  /**
   * Format a field value into a user-friendly label
   */
  function formatFieldLabel(field: string): string {
    // Convert camelCase to Title Case with spaces
    return field
      .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
      .trim();
  }

  return (
    <div className={classNames('flex flex-col sm:flex-row gap-3 items-end', { 'opacity-50': disabled })}>
      <div className="space-y-1">
        <label htmlFor="sort-field" className="block text-sm font-medium text-gray-700">
          Sort By
        </label>
        <Select
          id="sort-field"
          name="sortField"
          className="w-full sm:w-40"
          value={selectedField}
          onChange={handleFieldChange}
          disabled={disabled}
          aria-label="Sort field"
        >
          {availableFields.map((fieldValue) => (
            <option key={fieldValue} value={fieldValue}>
              {formatFieldLabel(fieldValue)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="sort-direction" className="block text-sm font-medium text-gray-700">
          Direction
        </label>
        <Select
          id="sort-direction"
          name="sortDirection"
          className="w-full sm:w-32"
          value={selectedDirection}
          onChange={handleDirectionChange}
          disabled={disabled}
          aria-label="Sort direction"
        >
          <option value={SortDirection.ASC}>Ascending</option>
          <option value={SortDirection.DESC}>Descending</option>
        </Select>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleApplySort}
          disabled={disabled}
          aria-label="Apply sort"
        >
          Apply
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetSort}
          disabled={disabled}
          aria-label="Reset sort"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default SortSelector;