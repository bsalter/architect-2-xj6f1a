/**
 * Utility functions for formatting data values in the Interaction Management System
 * Provides consistent, human-readable formatting for various data types
 */

import { DATE_FORMAT_CONSTANTS, INTERACTION_TYPE_LABELS } from './constants';
import { formatDateTime } from './date';

/**
 * Formats an interaction type value into a user-friendly display label
 * 
 * @param type - The interaction type value to format
 * @returns Human-readable interaction type label or empty string if type is invalid
 */
export const formatInteractionType = (type: string | null | undefined): string => {
  if (!type) return '';
  
  // Look up the display label from the constants
  const label = INTERACTION_TYPE_LABELS[type as keyof typeof INTERACTION_TYPE_LABELS];
  
  // Return the label if found, otherwise return the original type
  return label || type;
};

/**
 * Formats a location string for display, handling virtual/remote locations specially
 * 
 * @param location - The location string to format
 * @returns Formatted location string or appropriate placeholder
 */
export const formatLocation = (location: string | null | undefined): string => {
  if (!location || location.trim() === '') return 'No location specified';
  
  // Check for virtual/remote keywords
  const virtualKeywords = ['virtual', 'remote', 'online', 'zoom', 'teams', 'web', 'video'];
  const lowercaseLocation = location.toLowerCase().trim();
  
  for (const keyword of virtualKeywords) {
    if (lowercaseLocation.includes(keyword)) {
      return 'Virtual Meeting';
    }
  }
  
  return location;
};

/**
 * Truncates text to a specified maximum length with ellipsis
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis or empty string if input is invalid
 */
export const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  // Truncate and add ellipsis, being careful not to cut words in the middle when possible
  const truncated = text.substring(0, maxLength);
  
  // If we can find a space to break at within the last 10 characters, use that
  const lastSpaceIndex = truncated.lastIndexOf(' ', maxLength - 10);
  
  if (lastSpaceIndex > maxLength * 0.7) { // Only use this if the space isn't too far back
    return `${truncated.substring(0, lastSpaceIndex)}...`;
  }
  
  return `${truncated}...`;
};

/**
 * Formats a person's name for consistent display
 * 
 * @param name - The person name to format
 * @returns Formatted name or appropriate placeholder
 */
export const formatPersonName = (name: string | null | undefined): string => {
  if (!name || name.trim() === '') return 'Unassigned';
  
  // Handle specific prefixes like "Dr.", "Mr.", etc.
  const prefixes = ['Dr', 'Dr.', 'Mr', 'Mr.', 'Mrs', 'Mrs.', 'Ms', 'Ms.', 'Prof', 'Prof.'];
  let nameWithoutPrefix = name.trim();
  let prefix = '';
  
  for (const p of prefixes) {
    if (nameWithoutPrefix.startsWith(p + ' ')) {
      prefix = p + ' ';
      nameWithoutPrefix = nameWithoutPrefix.substring(p.length + 1);
      break;
    }
  }
  
  // Split the name into parts
  const nameParts = nameWithoutPrefix.split(' ');
  
  // Capitalize each part, handling complex cases
  const formattedParts = nameParts.map(part => {
    // Skip empty parts
    if (!part) return '';
    
    // Handle hyphenated names (e.g., Smith-Jones)
    if (part.includes('-')) {
      return part.split('-')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join('-');
    }
    
    // Handle names with apostrophes (e.g., O'Brien)
    if (part.includes("'")) {
      const apostropheIndex = part.indexOf("'");
      return part.charAt(0).toUpperCase() +
        part.slice(1, apostropheIndex + 1).toLowerCase() +
        part.charAt(apostropheIndex + 1).toUpperCase() +
        part.slice(apostropheIndex + 2).toLowerCase();
    }
    
    // Handle McNames and MacNames
    if (part.toLowerCase().startsWith('mc') && part.length > 2) {
      return 'Mc' + part.charAt(2).toUpperCase() + part.slice(3).toLowerCase();
    }
    
    if (part.toLowerCase().startsWith('mac') && part.length > 3) {
      return 'Mac' + part.charAt(3).toUpperCase() + part.slice(4).toLowerCase();
    }
    
    // Handle standard name parts
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  });
  
  return prefix + formattedParts.join(' ');
};

/**
 * Calculates and formats the duration between two dates
 * 
 * @param startDateTime - The start date/time
 * @param endDateTime - The end date/time
 * @returns Formatted duration string (e.g., '1 hour 30 minutes') or empty string if dates are invalid
 */
export const formatDuration = (
  startDateTime: string | Date | null | undefined,
  endDateTime: string | Date | null | undefined
): string => {
  if (!startDateTime || !endDateTime) return '';
  
  // Convert to Date objects if they are strings
  const startDate = typeof startDateTime === 'string' ? new Date(startDateTime) : startDateTime;
  const endDate = typeof endDateTime === 'string' ? new Date(endDateTime) : endDateTime;
  
  // Check if dates are valid
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return '';
  }
  
  // Calculate the duration in milliseconds
  const durationMs = endDate.getTime() - startDate.getTime();
  
  // Handle negative duration
  if (durationMs < 0) return '';
  
  // Calculate hours and minutes
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  // Format the duration string
  if (hours === 0 && minutes === 0) {
    return 'Less than a minute';
  }
  
  let formattedDuration = '';
  
  if (hours > 0) {
    formattedDuration += `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  if (minutes > 0) {
    if (formattedDuration) {
      formattedDuration += ' ';
    }
    formattedDuration += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return formattedDuration;
};

/**
 * Formats a start and end date/time pair as a readable range
 * 
 * @param startDateTime - The start date/time
 * @param endDateTime - The end date/time
 * @param timezone - The timezone for the date/time values
 * @returns Formatted date/time range
 */
export const formatDateTimeRange = (
  startDateTime: string | Date | null | undefined,
  endDateTime: string | Date | null | undefined,
  timezone: string | null | undefined
): string => {
  if (!startDateTime || !endDateTime) return '';
  
  // Convert to Date objects if they are strings
  const startDate = typeof startDateTime === 'string' ? new Date(startDateTime) : startDateTime;
  const endDate = typeof endDateTime === 'string' ? new Date(endDateTime) : endDateTime;
  
  // Check if dates are valid
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return '';
  }
  
  // Check if the dates are on the same day
  const sameDay = startDate.toDateString() === endDate.toDateString();
  
  if (sameDay) {
    // For same day, format as "Aug 15, 2023 10:00 AM - 11:30 AM"
    const datePart = formatDateTime(startDate, timezone, 'MMM dd, yyyy');
    const startTimePart = formatDateTime(startDate, timezone, 'h:mm a');
    const endTimePart = formatDateTime(endDate, timezone, 'h:mm a');
    
    return `${datePart} ${startTimePart} - ${endTimePart}`;
  } else {
    // For different days, format as "Aug 15, 2023 10:00 AM - Aug 16, 2023 11:30 AM"
    const startDateTimePart = formatDateTime(startDate, timezone, 'MMM dd, yyyy h:mm a');
    const endDateTimePart = formatDateTime(endDate, timezone, 'MMM dd, yyyy h:mm a');
    
    return `${startDateTimePart} - ${endDateTimePart}`;
  }
};

/**
 * Formats a boolean value as a user-friendly string
 * 
 * @param value - The boolean value to format
 * @param options - Optional configuration for the formatted output
 * @returns Formatted boolean string (e.g., 'Yes'/'No' or custom labels)
 */
export const formatBoolean = (
  value: boolean | null | undefined, 
  options?: { trueLabel?: string; falseLabel?: string }
): string => {
  if (value === null || value === undefined) return '';
  
  const trueLabel = options?.trueLabel || 'Yes';
  const falseLabel = options?.falseLabel || 'No';
  
  return value ? trueLabel : falseLabel;
};

/**
 * Formats a number value according to specified options
 * 
 * @param value - The number value to format
 * @param options - Optional configuration for number formatting
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    style?: 'decimal' | 'percent' | 'currency';
    currency?: string;
    locale?: string;
  }
): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  const locale = options?.locale || 'en-US';
  
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
    style: options?.style || 'decimal',
  };
  
  if (options?.style === 'currency') {
    formatOptions.currency = options?.currency || 'USD';
  }
  
  return new Intl.NumberFormat(locale, formatOptions).format(value);
};