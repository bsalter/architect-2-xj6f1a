import React from 'react'; // version: 18.2.0
import {
  formatDateForInput,
  formatTimeForInput,
  isValidDate,
  isValidDateRange,
  combineDateAndTime
} from '../../utils/date';
import DatePicker from '../ui/DatePicker';
import TimezoneSelect from '../ui/TimezoneSelect';
import FormField from '../ui/FormField';
import Input from '../ui/Input';

/**
 * Interface for DateTimeSelector component props
 */
interface DateTimeSelectorProps {
  /**
   * The currently selected start date
   */
  startDate: Date | null;

  /**
   * The currently selected end date
   */
  endDate: Date | null;

  /**
   * Start time in HH:MM format
   */
  startTime: string;

  /**
   * End time in HH:MM format
   */
  endTime: string;

  /**
   * The selected timezone
   */
  timezone: string;

  /**
   * Callback when start date changes
   */
  onStartDateChange: (date: Date | null) => void;

  /**
   * Callback when end date changes
   */
  onEndDateChange: (date: Date | null) => void;

  /**
   * Callback when start time changes
   */
  onStartTimeChange: (time: string) => void;

  /**
   * Callback when end time changes
   */
  onEndTimeChange: (time: string) => void;

  /**
   * Callback when timezone changes
   */
  onTimezoneChange: (timezone: string) => void;

  /**
   * Error message to display
   */
  error?: string;
}

/**
 * Validates that the end date/time is after the start date/time
 * 
 * @param startDate - Start date
 * @param startTime - Start time in HH:MM format
 * @param endDate - End date
 * @param endTime - End time in HH:MM format
 * @returns True if the date range is valid, false otherwise
 */
const validateDateRange = (
  startDate: Date | null,
  startTime: string,
  endDate: Date | null,
  endTime: string
): boolean => {
  // Check if both dates are valid
  if (!startDate || !endDate) {
    return false;
  }

  // Combine date and time
  const startDateTime = combineDateAndTime(startDate, startTime);
  const endDateTime = combineDateAndTime(endDate, endTime);

  // Check if combined dates are valid
  if (!startDateTime || !endDateTime) {
    return false;
  }

  // Check if end date/time is after start date/time
  return isValidDateRange(startDateTime, endDateTime);
};

/**
 * Formats a time string to ensure it follows HH:MM format
 * 
 * @param time - Time string to format
 * @returns Formatted time string
 */
const formatTimeInput = (time: string): string => {
  // Remove any non-numeric characters except colon
  const cleaned = time.replace(/[^\d:]/g, '');
  
  // Handle special cases
  if (!cleaned) return '';
  
  // Split into hours and minutes
  const parts = cleaned.split(':');
  let hours = '';
  let minutes = '';
  
  if (parts.length > 0) {
    // Handle hours
    const hourValue = parseInt(parts[0], 10);
    if (!isNaN(hourValue) && hourValue >= 0 && hourValue <= 23) {
      hours = hourValue.toString().padStart(2, '0');
    } else if (parts[0] !== '') {
      // If invalid but not empty, use last valid value or empty
      hours = parts[0].slice(0, 2).padStart(2, '0');
      if (hours.length === 2 && parseInt(hours, 10) > 23) {
        hours = '23';
      }
    }
    
    // Handle minutes
    if (parts.length > 1) {
      const minuteValue = parseInt(parts[1], 10);
      if (!isNaN(minuteValue) && minuteValue >= 0 && minuteValue <= 59) {
        minutes = minuteValue.toString().padStart(2, '0');
      } else if (parts[1] !== '') {
        // If invalid but not empty, use last valid value or empty
        minutes = parts[1].slice(0, 2).padStart(2, '0');
        if (minutes.length === 2 && parseInt(minutes, 10) > 59) {
          minutes = '59';
        }
      }
    }
  }
  
  // Combine hours and minutes
  if (hours && minutes) {
    return `${hours}:${minutes}`;
  } else if (hours) {
    return `${hours}:00`;
  }
  
  return cleaned; // Return original cleaned input if we couldn't format
};

/**
 * A component for selecting start and end date/time with timezone for interactions
 */
const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  startDate,
  endDate,
  startTime,
  endTime,
  timezone,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onTimezoneChange,
  error
}) => {
  /**
   * Handles changes to the start date
   */
  const handleStartDateChange = (date: Date | null): void => {
    onStartDateChange(date);
  };

  /**
   * Handles changes to the end date
   */
  const handleEndDateChange = (date: Date | null): void => {
    onEndDateChange(date);
  };

  /**
   * Handles changes to the start time
   */
  const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    const formattedTime = formatTimeInput(value);
    onStartTimeChange(formattedTime);
  };

  /**
   * Handles changes to the end time
   */
  const handleEndTimeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    const formattedTime = formatTimeInput(value);
    onEndTimeChange(formattedTime);
  };

  /**
   * Handles changes to the timezone
   */
  const handleTimezoneChange = (timezone: string): void => {
    onTimezoneChange(timezone);
  };

  /**
   * Determines the validation error message for date/time fields
   */
  const getValidationError = (): string | undefined => {
    // If an error was explicitly passed, use that
    if (error) {
      return error;
    }

    // If we have both dates, validate the range
    if (startDate && endDate && startTime && endTime) {
      const isValid = validateDateRange(startDate, startTime, endDate, endTime);
      if (!isValid) {
        return 'End date/time must be after start date/time';
      }
    }

    return undefined;
  };

  // Get validation error message
  const validationError = getValidationError();

  return (
    <div className="date-time-selector">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Start Date/Time Section */}
        <div>
          <DatePicker
            id="start-date"
            name="startDate"
            label="Start Date"
            value={startDate}
            onChange={handleStartDateChange}
            error={validationError}
          />
          
          <FormField
            label="Start Time"
            htmlFor="start-time"
            error={validationError}
          >
            <Input
              id="start-time"
              name="startTime"
              type="time"
              value={startTime}
              onChange={handleStartTimeChange}
              placeholder="HH:MM"
              required
            />
          </FormField>
        </div>

        {/* End Date/Time Section */}
        <div>
          <DatePicker
            id="end-date"
            name="endDate"
            label="End Date"
            value={endDate}
            onChange={handleEndDateChange}
            error={validationError}
          />
          
          <FormField
            label="End Time"
            htmlFor="end-time"
            error={validationError}
          >
            <Input
              id="end-time"
              name="endTime"
              type="time"
              value={endTime}
              onChange={handleEndTimeChange}
              placeholder="HH:MM"
              required
            />
          </FormField>
        </div>
      </div>

      {/* Timezone Section */}
      <div className="mt-4">
        <FormField
          label="Timezone"
          htmlFor="timezone"
          error={validationError}
        >
          <TimezoneSelect
            id="timezone"
            name="timezone"
            value={timezone}
            onChange={handleTimezoneChange}
            required
          />
        </FormField>
      </div>
    </div>
  );
};

export default DateTimeSelector;