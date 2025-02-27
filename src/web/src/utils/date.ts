/**
 * Utility functions for date and time handling in the Interaction Management System
 * Provides formatting, validation, conversion, and timezone operations for date/time fields
 * 
 * @module date
 */

import {
  format,
  parse,
  parseISO,
  isValid,
  isAfter,
  isBefore,
  addDays
} from 'date-fns'; // version 2.30.0
import {
  formatInTimeZone,
  zonedTimeToUtc,
  utcToZonedTime
} from 'date-fns-tz'; // version 2.0.0

import {
  DATE_FORMAT_CONSTANTS,
  TIMEZONE_OPTIONS,
  DEFAULT_INTERACTION_VALUES
} from './constants';

// Use the default timezone from the interaction defaults as fallback
const DEFAULT_TIMEZONE = DEFAULT_INTERACTION_VALUES.timezone;

/**
 * Formats a Date object into a string suitable for HTML date input (YYYY-MM-DD)
 * 
 * @param date - The date to format
 * @returns Formatted date string or empty string if input is invalid
 */
export const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  // HTML date inputs require the format yyyy-MM-dd
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Formats a Date object into a string suitable for HTML time input (HH:mm)
 * 
 * @param date - The date to extract time from
 * @returns Formatted time string or empty string if input is invalid
 */
export const formatTimeForInput = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, DATE_FORMAT_CONSTANTS.TIME_FORMAT);
};

/**
 * Parses a date string into a Date object with flexible format support
 * 
 * @param dateString - The date string to parse
 * @param formatString - The format string to use for parsing
 * @returns Parsed Date object or null if parsing fails
 */
export const parseDate = (
  dateString: string | null | undefined, 
  formatString: string = DATE_FORMAT_CONSTANTS.DATE_FORMAT
): Date | null => {
  if (!dateString) return null;
  
  try {
    // Try to parse with the provided format
    const parsedDate = parse(dateString, formatString, new Date());
    if (isValid(parsedDate)) return parsedDate;
    
    // If that fails, try API format
    const apiDate = parse(dateString, DATE_FORMAT_CONSTANTS.API_DATE_FORMAT, new Date());
    if (isValid(apiDate)) return apiDate;
    
    // If that fails, try ISO format
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) return isoDate;
  } catch (error) {
    // If all parsing methods fail, return null
    return null;
  }
  
  return null;
};

/**
 * Formats a Date object into a human-readable date and time string with timezone support
 * 
 * @param date - The date to format
 * @param timezone - The timezone to use for formatting (defaults to DEFAULT_TIMEZONE)
 * @param formatString - The format string to use
 * @returns Formatted date and time string or empty string if input is invalid
 */
export const formatDateTime = (
  date: Date | string | null | undefined,
  timezone: string | null | undefined,
  formatString: string = DATE_FORMAT_CONSTANTS.DATETIME_FORMAT
): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  const tz = timezone || DEFAULT_TIMEZONE;
  
  return formatInTimeZone(dateObj, tz, formatString);
};

/**
 * Checks if a value is a valid date
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date, false otherwise
 */
export const isValidDate = (value: any): boolean => {
  if (!value) return false;
  
  const dateObj = typeof value === 'string' ? new Date(value) : value;
  
  return isValid(dateObj);
};

/**
 * Validates that end date is after or equal to start date
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns True if the range is valid, false otherwise
 */
export const isValidDateRange = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): boolean => {
  if (!startDate || !endDate) return false;
  
  const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (!isValid(startObj) || !isValid(endObj)) return false;
  
  // End date should be equal to or after start date
  return isAfter(endObj, startObj) || startObj.getTime() === endObj.getTime();
};

/**
 * Combines separate date and time values into a single Date object
 * 
 * @param date - The date value
 * @param time - The time value in HH:mm format
 * @returns Combined Date object or null if inputs are invalid
 */
export const combineDateAndTime = (
  date: Date | string | null | undefined,
  time: string | null | undefined
): Date | null => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return null;
  
  // Create a new Date object to avoid mutating the original
  const result = new Date(dateObj.getTime());
  
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    
    if (!isNaN(hours) && !isNaN(minutes)) {
      result.setHours(hours, minutes, 0, 0);
    }
  }
  
  return result;
};

/**
 * Gets the current browser timezone or falls back to default
 * 
 * @returns Current timezone identifier (e.g., 'America/New_York')
 */
export const getCurrentTimezone = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || DEFAULT_TIMEZONE;
  } catch (error) {
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Returns a list of timezone options for select components
 * 
 * @returns Array of timezone options with values and labels
 */
export const getTimezoneOptions = (): Array<{value: string, label: string}> => {
  return TIMEZONE_OPTIONS;
};

/**
 * Converts a date from one timezone to another
 * 
 * @param date - The date to convert
 * @param fromTimezone - The source timezone
 * @param toTimezone - The target timezone
 * @returns Date converted to the target timezone or null if input is invalid
 */
export const convertToTimezone = (
  date: Date | string | null | undefined,
  fromTimezone: string,
  toTimezone: string
): Date | null => {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) return null;
  
  // Convert to UTC first
  const utcDate = zonedTimeToUtc(dateObj, fromTimezone);
  
  // Then convert to target timezone
  return utcToZonedTime(utcDate, toTimezone);
};

/**
 * Calculates the difference between two dates in the specified unit
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @param unit - The unit of measurement (e.g., 'days', 'hours', 'minutes')
 * @returns Difference in the specified unit or null if inputs are invalid
 */
export const getDateDifference = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  unit: string
): number | null => {
  if (!startDate || !endDate) return null;
  
  const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (!isValid(startObj) || !isValid(endObj)) return null;
  
  // Calculate difference in milliseconds
  const diffMs = endObj.getTime() - startObj.getTime();
  
  // Convert to the requested unit
  switch (unit.toLowerCase()) {
    case 'days':
      return diffMs / (1000 * 60 * 60 * 24);
    case 'hours':
      return diffMs / (1000 * 60 * 60);
    case 'minutes':
      return diffMs / (1000 * 60);
    case 'seconds':
      return diffMs / 1000;
    default:
      return diffMs; // Default to milliseconds
  }
};