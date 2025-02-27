import React, { useMemo } from 'react';
import classNames from 'classnames'; // v2.3.2
import Select from './Select';
import { getTimezoneOptions, getCurrentTimezone } from '../../utils/date';
import { TIMEZONE_OPTIONS } from '../../utils/constants';

/**
 * Props for the TimezoneSelect component
 */
export interface TimezoneSelectProps {
  /** Unique identifier for the select element */
  id: string;
  /** Name attribute for the select element */
  name: string;
  /** Selected timezone value */
  value?: string;
  /** Callback fired when the timezone selection changes */
  onChange: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional class names to apply to the select element */
  className?: string;
  /** Whether the select is required */
  required?: boolean;
  /** Placeholder text to display when no option is selected */
  placeholder?: string;
}

/**
 * A specialized select component for choosing timezone options with proper formatting of timezone names and offsets.
 * Used in the Interaction form to specify the timezone for start and end date/time fields.
 * 
 * @example
 * <TimezoneSelect
 *   id="timezone"
 *   name="timezone"
 *   value={formData.timezone}
 *   onChange={(value) => setFormData({...formData, timezone: value})}
 *   error={errors.timezone}
 *   required
 * />
 */
const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  id,
  name,
  value,
  onChange,
  error,
  disabled = false,
  className,
  required = false,
  placeholder = 'Select timezone',
}) => {
  // Use useMemo to cache the timezone options for better performance
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  
  // Handle onChange event with proper typing
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };
  
  // Set default value to current timezone if not provided
  const selectValue = value ?? getCurrentTimezone();
  
  return (
    <Select
      id={id}
      name={name}
      value={selectValue}
      onChange={handleChange}
      isError={!!error}
      disabled={disabled}
      className={classNames('timezone-select', className)}
      required={required}
      placeholder={placeholder}
      aria-label="Timezone"
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      data-testid="timezone-select"
    >
      {timezoneOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
};

export default TimezoneSelect;