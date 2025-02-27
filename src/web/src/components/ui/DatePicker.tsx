import React from 'react'; // v18.2.0
import { format, parse, isValid } from 'date-fns'; // v2.30.0
import FormField from '../ui/FormField';
import { formatDateForInput } from '../../utils/date';

/**
 * Props for the DatePicker component
 */
interface DatePickerProps {
  /**
   * Unique identifier for the input
   */
  id: string;
  
  /**
   * Input name for form submission
   */
  name: string;
  
  /**
   * Optional label text to display
   */
  label?: string;
  
  /**
   * The currently selected date
   */
  value: Date | null;
  
  /**
   * Callback when date changes
   */
  onChange: (date: Date | null) => void;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
}

/**
 * A React functional component that provides a date picker UI
 * for selecting dates in forms. Used primarily in the Interaction form
 * for selecting start and end dates of interactions.
 */
const DatePicker: React.FC<DatePickerProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = '',
  error,
  className = '',
  minDate,
  maxDate,
}) => {
  /**
   * Handles date input changes, validates and formats the date, then calls the onChange callback
   */
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = event.target.value;
    
    // If input is cleared, pass null to onChange
    if (!inputValue) {
      onChange(null);
      return;
    }
    
    // Try to parse the input value to a Date object
    try {
      const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
      
      if (isValid(parsedDate)) {
        // Check if date is within min/max range
        if (minDate && parsedDate < minDate) {
          // If before min date, don't update
          return;
        }
        
        if (maxDate && parsedDate > maxDate) {
          // If after max date, don't update
          return;
        }
        
        onChange(parsedDate);
      }
    } catch (error) {
      // If parsing fails, don't update the value
      console.error('Error parsing date:', error);
    }
  };
  
  // Format the date value for the input
  const inputValue = formatDateForInput(value);
  
  // Format min and max dates if provided
  const minDateValue = minDate ? formatDateForInput(minDate) : '';
  const maxDateValue = maxDate ? formatDateForInput(maxDate) : '';
  
  return (
    <FormField
      label={label || ''}
      error={error}
      htmlFor={id}
      className={className}
      required={false}
    >
      <input
        id={id}
        name={name}
        type="date"
        value={inputValue}
        onChange={handleDateChange}
        disabled={disabled}
        placeholder={placeholder}
        min={minDateValue}
        max={maxDateValue}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${error ? 'border-red-300' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FormField>
  );
};

export default DatePicker;