import React, { useState, useEffect, ChangeEvent } from 'react';
import { Select } from '../ui/Select';
import { formatTime, parseTime } from '../../utils/date';

/**
 * Interface for time options used in dropdown menus
 */
interface TimeOption {
  value: string;
  label: string;
}

/**
 * Generates an array of options for hours, minutes, or seconds dropdown
 * 
 * @param max - Maximum value (e.g., 24 for hours, 60 for minutes/seconds)
 * @param withLeadingZero - Whether to add leading zero for single digit values
 * @returns Array of option objects with value and label properties
 */
const generateTimeOptions = (max: number, withLeadingZero: boolean): TimeOption[] => {
  const options: TimeOption[] = [];
  for (let i = 0; i < max; i++) {
    const value = i.toString();
    const label = withLeadingZero && i < 10 ? `0${i}` : i.toString();
    options.push({ value, label });
  }
  return options;
};

/**
 * Props for the TimePicker component
 */
interface TimePickerProps {
  /** Current time value in HH:mm or HH:mm:ss format */
  value: string;
  /** Handler for time value changes */
  onChange: (time: string) => void;
  /** Whether the time picker is disabled */
  disabled?: boolean;
  /** Error message for validation */
  error?: string;
  /** Whether to show seconds selection */
  showSeconds?: boolean;
  /** Whether to use 24-hour format (true) or 12-hour format (false) */
  is24Hour?: boolean;
  /** Additional class name for the component */
  className?: string;
}

/**
 * A reusable time picker component for selecting hours, minutes, and optional seconds.
 * Supports both 12-hour and 24-hour formats.
 * 
 * @param props - Component props
 * @returns TimePicker component
 */
const TimePicker: React.FC<TimePickerProps> = ({
  value = '',
  onChange,
  disabled = false,
  error,
  showSeconds = false,
  is24Hour = true,
  className = '',
}) => {
  // Parse the time string into components
  const { hours: initialHours, minutes: initialMinutes, seconds: initialSeconds, period: initialPeriod } = parseTime(value);

  // State for each time component
  const [hours, setHours] = useState<string>(initialHours);
  const [minutes, setMinutes] = useState<string>(initialMinutes);
  const [seconds, setSeconds] = useState<string>(initialSeconds);
  const [period, setPeriod] = useState<string>(initialPeriod);

  // Generate options for each dropdown
  const hourOptions = generateTimeOptions(is24Hour ? 24 : 12, true);
  const minuteOptions = generateTimeOptions(60, true);
  const secondOptions = generateTimeOptions(60, true);
  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  // Update internal state when the value prop changes
  useEffect(() => {
    const { hours, minutes, seconds, period } = parseTime(value);
    setHours(hours);
    setMinutes(minutes);
    setSeconds(seconds);
    setPeriod(period);
  }, [value]);

  // Handlers for each dropdown change
  const handleHourChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newHours = event.target.value;
    setHours(newHours);
    onChange(formatTime(newHours, minutes, seconds, period, is24Hour, showSeconds));
  };

  const handleMinuteChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = event.target.value;
    setMinutes(newMinutes);
    onChange(formatTime(hours, newMinutes, seconds, period, is24Hour, showSeconds));
  };

  const handleSecondChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newSeconds = event.target.value;
    setSeconds(newSeconds);
    onChange(formatTime(hours, minutes, newSeconds, period, is24Hour, showSeconds));
  };

  const handlePeriodChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    onChange(formatTime(hours, minutes, seconds, newPeriod, is24Hour, showSeconds));
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Hours dropdown */}
      <div className="w-20">
        <Select
          id="time-hours"
          name="hours"
          value={hours}
          onChange={handleHourChange}
          disabled={disabled}
          isError={!!error}
          aria-label="Hours"
        >
          {hourOptions.map(option => (
            <option key={`hour-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <span className="self-center">:</span>

      {/* Minutes dropdown */}
      <div className="w-20">
        <Select
          id="time-minutes"
          name="minutes"
          value={minutes}
          onChange={handleMinuteChange}
          disabled={disabled}
          isError={!!error}
          aria-label="Minutes"
        >
          {minuteOptions.map(option => (
            <option key={`minute-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Seconds dropdown (optional) */}
      {showSeconds && (
        <>
          <span className="self-center">:</span>
          <div className="w-20">
            <Select
              id="time-seconds"
              name="seconds"
              value={seconds}
              onChange={handleSecondChange}
              disabled={disabled}
              isError={!!error}
              aria-label="Seconds"
            >
              {secondOptions.map(option => (
                <option key={`second-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </>
      )}

      {/* AM/PM selection (only for 12-hour format) */}
      {!is24Hour && (
        <div className="w-20">
          <Select
            id="time-period"
            name="period"
            value={period}
            onChange={handlePeriodChange}
            disabled={disabled}
            isError={!!error}
            aria-label="AM/PM"
          >
            {periodOptions.map(option => (
              <option key={`period-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Error message */}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

/**
 * Parses a time string into its component parts
 * 
 * @param timeString - The time string to parse (e.g., "14:30" or "02:30 PM")
 * @returns Object containing hours, minutes, seconds and period
 */
function parseTime(timeString: string): { hours: string; minutes: string; seconds: string; period: string } {
  // Default values
  const defaultResult = {
    hours: '00',
    minutes: '00',
    seconds: '00',
    period: 'AM'
  };

  if (!timeString) return defaultResult;

  try {
    // Handle 12-hour format with AM/PM
    if (timeString.includes('AM') || timeString.includes('PM')) {
      const period = timeString.includes('AM') ? 'AM' : 'PM';
      const timePart = timeString.replace(/(AM|PM)/, '').trim();
      const [hoursStr, minutesStr, secondsStr] = timePart.split(':');
      
      return {
        hours: hoursStr.padStart(2, '0'),
        minutes: minutesStr ? minutesStr.padStart(2, '0') : '00',
        seconds: secondsStr ? secondsStr.padStart(2, '0') : '00',
        period
      };
    }
    
    // Handle 24-hour format
    const [hoursStr, minutesStr, secondsStr] = timeString.split(':');
    const hoursNum = parseInt(hoursStr, 10);
    
    return {
      hours: hoursStr.padStart(2, '0'),
      minutes: minutesStr ? minutesStr.padStart(2, '0') : '00',
      seconds: secondsStr ? secondsStr.padStart(2, '0') : '00',
      period: hoursNum >= 12 ? 'PM' : 'AM'
    };
  } catch (error) {
    return defaultResult;
  }
}

/**
 * Formats time components into a time string
 * 
 * @param hours - Hours value
 * @param minutes - Minutes value
 * @param seconds - Seconds value
 * @param period - AM/PM for 12-hour format
 * @param is24Hour - Whether to use 24-hour format
 * @param includeSeconds - Whether to include seconds in the result
 * @returns Formatted time string
 */
function formatTime(
  hours: string,
  minutes: string,
  seconds: string,
  period: string,
  is24Hour: boolean,
  includeSeconds: boolean
): string {
  // Parse numeric values
  let hoursNum = parseInt(hours, 10) || 0;
  const minutesNum = parseInt(minutes, 10) || 0;
  const secondsNum = parseInt(seconds, 10) || 0;
  
  // Convert to 24-hour format if needed
  if (!is24Hour && period === 'PM' && hoursNum < 12) {
    hoursNum += 12;
  } else if (!is24Hour && period === 'AM' && hoursNum === 12) {
    hoursNum = 0;
  }
  
  // Format with leading zeros
  const formattedHours = hoursNum.toString().padStart(2, '0');
  const formattedMinutes = minutesNum.toString().padStart(2, '0');
  const formattedSeconds = secondsNum.toString().padStart(2, '0');
  
  // Build the time string
  let timeString = `${formattedHours}:${formattedMinutes}`;
  if (includeSeconds) {
    timeString += `:${formattedSeconds}`;
  }
  
  // Add AM/PM for 12-hour format
  if (!is24Hour) {
    timeString += ` ${period}`;
  }
  
  return timeString;
}

export default TimePicker;