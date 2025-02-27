import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames'; // v2.3.2
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Select from '../ui/Select';
import DatePicker from '../ui/DatePicker';
import TimezoneSelect from '../ui/TimezoneSelect';
import FilterTag from './FilterTag';
import { InteractionType, InteractionSearchParams, InteractionSearchFilters } from '../../types/interactions';
import { formatDateForInput } from '../../utils/date';

export interface AdvancedFiltersProps {
  filters?: InteractionSearchParams;
  onApplyFilters: (filters: InteractionSearchParams) => void;
  onClearFilters: () => void;
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onApplyFilters,
  onClearFilters,
  className = '',
}) => {
  // State to track form field values
  const [filterValues, setFilterValues] = useState<InteractionSearchFilters>({
    title: '',
    type: undefined,
    lead: '',
    startDate: undefined,
    endDate: undefined,
    location: '',
  });
  
  // Separate state for timezone (context for date interpretation)
  const [timezone, setTimezone] = useState<string>('America/New_York');
  
  // State for tracking date validation errors
  const [dateError, setDateError] = useState<string | null>(null);

  // Update local state when filters prop changes
  useEffect(() => {
    if (filters?.filters) {
      setFilterValues(filters.filters);
    } else {
      setFilterValues({
        title: '',
        type: undefined,
        lead: '',
        startDate: undefined,
        endDate: undefined,
        location: '',
      });
    }
  }, [filters]);

  // Handle changes to text input fields
  const handleInputChange = (field: keyof InteractionSearchFilters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilterValues((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // Handle changes to the type select field
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as InteractionType | '';
    setFilterValues((prev) => ({
      ...prev,
      type: value ? value as InteractionType : undefined,
    }));
  };

  // Handle changes to date fields
  const handleDateChange = (field: 'startDate' | 'endDate') => (date: Date | null) => {
    const formattedDate = date ? formatDateForInput(date) : undefined;
    
    setFilterValues((prev) => {
      const newValues = {
        ...prev,
        [field]: formattedDate,
      };
      
      // Validate date range if both dates are set
      if (newValues.startDate && newValues.endDate) {
        if (!validateDateRange(newValues.startDate, newValues.endDate)) {
          setDateError('End date must be after start date');
        } else {
          setDateError(null);
        }
      } else {
        setDateError(null);
      }
      
      return newValues;
    });
  };

  // Handle timezone changes
  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
  };

  // Apply filters when the Apply button is clicked
  const handleApplyFilters = () => {
    // Don't apply if there's a date error
    if (dateError) return;
    
    // Create a filters object without empty values
    const filtersToApply: InteractionSearchFilters = {};
    
    if (filterValues.title) filtersToApply.title = filterValues.title;
    if (filterValues.type) filtersToApply.type = filterValues.type;
    if (filterValues.lead) filtersToApply.lead = filterValues.lead;
    if (filterValues.startDate) filtersToApply.startDate = filterValues.startDate;
    if (filterValues.endDate) filtersToApply.endDate = filterValues.endDate;
    if (filterValues.location) filtersToApply.location = filterValues.location;
    
    // Call the onApplyFilters callback with the new filters
    onApplyFilters({
      ...filters,
      filters: Object.keys(filtersToApply).length > 0 ? filtersToApply : undefined,
      page: 1, // Reset to first page when filters change
    });
  };

  // Remove a specific filter
  const handleRemoveFilter = (field: keyof InteractionSearchFilters) => {
    setFilterValues((prev) => {
      const newValues = { ...prev };
      newValues[field] = undefined;
      
      // Apply the updated filters
      const filtersToApply: InteractionSearchFilters = {};
      Object.entries(newValues).forEach(([key, value]) => {
        if (value) {
          filtersToApply[key as keyof InteractionSearchFilters] = value;
        }
      });
      
      // Call the onApplyFilters callback with the new filters
      onApplyFilters({
        ...filters,
        filters: Object.keys(filtersToApply).length > 0 ? filtersToApply : undefined,
        page: 1, // Reset to first page when filters change
      });
      
      return newValues;
    });
  };

  // Clear all filters when the Clear All button is clicked
  const handleClearFilters = () => {
    setFilterValues({
      title: '',
      type: undefined,
      lead: '',
      startDate: undefined,
      endDate: undefined,
      location: '',
    });
    setDateError(null);
    onClearFilters();
  };

  // Get active filters for display as tags
  const activeFilters = getActiveFilters(filters?.filters);
  
  return (
    <div className={classNames('bg-gray-50 p-4 rounded-md', className)}>
      <div className="text-sm font-medium text-gray-700 mb-3">Filter by:</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Title filter */}
        <FormField label="Title" htmlFor="filter-title">
          <Input
            id="filter-title"
            name="title"
            value={filterValues.title || ''}
            onChange={handleInputChange('title')}
            placeholder="Filter by title"
            fullWidth
          />
        </FormField>
        
        {/* Type filter */}
        <FormField label="Type" htmlFor="filter-type">
          <Select
            id="filter-type"
            name="type"
            value={filterValues.type || ''}
            onChange={handleTypeChange}
            placeholder="Select type"
          >
            <option value="">All types</option>
            {Object.values(InteractionType).map((type) => (
              <option key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </FormField>
        
        {/* Lead filter */}
        <FormField label="Lead" htmlFor="filter-lead">
          <Input
            id="filter-lead"
            name="lead"
            value={filterValues.lead || ''}
            onChange={handleInputChange('lead')}
            placeholder="Filter by lead"
            fullWidth
          />
        </FormField>
        
        {/* Date range filters */}
        <FormField 
          label="Start Date" 
          htmlFor="filter-start-date"
          error={dateError}
        >
          <DatePicker
            id="filter-start-date"
            name="startDate"
            value={filterValues.startDate ? new Date(filterValues.startDate) : null}
            onChange={handleDateChange('startDate')}
            placeholder="From date"
          />
        </FormField>
        
        <FormField label="End Date" htmlFor="filter-end-date">
          <DatePicker
            id="filter-end-date"
            name="endDate"
            value={filterValues.endDate ? new Date(filterValues.endDate) : null}
            onChange={handleDateChange('endDate')}
            placeholder="To date"
          />
        </FormField>
        
        {/* Timezone selection (for date context) */}
        <FormField label="Timezone" htmlFor="filter-timezone">
          <TimezoneSelect
            id="filter-timezone"
            name="timezone"
            value={timezone}
            onChange={handleTimezoneChange}
            placeholder="Select timezone"
          />
        </FormField>
        
        {/* Location filter */}
        <FormField label="Location" htmlFor="filter-location">
          <Input
            id="filter-location"
            name="location"
            value={filterValues.location || ''}
            onChange={handleInputChange('location')}
            placeholder="Filter by location"
            fullWidth
          />
        </FormField>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex">
          <Button
            variant="primary"
            onClick={handleApplyFilters}
            disabled={!!dateError}
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="ml-2"
          >
            Clear All
          </Button>
        </div>
        
        {/* Filter count summary */}
        {activeFilters.length > 0 && (
          <div className="text-sm text-gray-600">
            {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} applied
          </div>
        )}
      </div>
      
      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap">
          {activeFilters.map((filter) => (
            <FilterTag
              key={filter.field}
              field={filter.field}
              value={filter.value}
              label={filter.label}
              onRemove={() => handleRemoveFilter(filter.field as keyof InteractionSearchFilters)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Extracts active filters from the filter state for display as filter tags
 */
const getActiveFilters = (filters: InteractionSearchFilters | undefined): Array<{field: string, value: string | number | boolean, label: string}> => {
  if (!filters) return [];
  
  const result: Array<{field: string, value: string | number | boolean, label: string}> = [];
  
  if (filters.title) {
    result.push({
      field: 'title',
      value: filters.title,
      label: 'Title',
    });
  }
  
  if (filters.type) {
    result.push({
      field: 'type',
      value: filters.type.charAt(0) + filters.type.slice(1).toLowerCase(),
      label: 'Type',
    });
  }
  
  if (filters.lead) {
    result.push({
      field: 'lead',
      value: filters.lead,
      label: 'Lead',
    });
  }
  
  if (filters.startDate) {
    result.push({
      field: 'startDate',
      value: filters.startDate,
      label: 'Start Date',
    });
  }
  
  if (filters.endDate) {
    result.push({
      field: 'endDate',
      value: filters.endDate,
      label: 'End Date',
    });
  }
  
  if (filters.location) {
    result.push({
      field: 'location',
      value: filters.location,
      label: 'Location',
    });
  }
  
  return result;
};

/**
 * Validates that the end date is after or equal to the start date
 */
const validateDateRange = (startDate: string | null | undefined, endDate: string | null | undefined): boolean => {
  if (!startDate || !endDate) return true;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end;
};

export default AdvancedFilters;