/**
 * Utility functions for form validation throughout the application
 * Provides validators for the Interaction form fields and general-purpose validation
 * 
 * @module validation
 */

import { InteractionFormData } from '../types/interactions';
import { isValidDate as dateIsValid } from './date';
import { FORM_VALIDATION } from './constants';

// Regular expression for validating email addresses
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Interface for validation errors object with field-specific error messages
 */
export interface ValidationErrors {
  title?: string;
  type?: string;
  lead?: string;
  startDateTime?: string;
  endDateTime?: string;
  timezone?: string;
  location?: string;
  description?: string;
  notes?: string;
}

/**
 * Validates if a value is not empty
 * 
 * @param value - The value to check
 * @returns True if value is not empty, false otherwise
 */
export const isRequired = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validates if a string is a properly formatted email address
 * 
 * @param email - The email string to validate
 * @returns True if email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
};

/**
 * Validates if a string or Date object is a valid date
 * 
 * @param date - The date to validate
 * @returns True if date is valid, false otherwise
 */
export const isValidDate = (date: string | Date): boolean => {
  return dateIsValid(date);
};

/**
 * Validates that end date is after start date
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns True if end date is after start date, false otherwise
 */
export const isEndDateAfterStartDate = (
  startDate: string | Date,
  endDate: string | Date
): boolean => {
  if (!startDate || !endDate) return false;
  
  const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (!isValidDate(startObj) || !isValidDate(endObj)) return false;
  
  // Ensure end date is strictly after start date
  return endObj.getTime() > startObj.getTime();
};

/**
 * Validates all fields in an interaction form data object
 * 
 * @param formData - The interaction form data to validate
 * @returns Object with field-specific error messages or empty object if validation passes
 */
export const validateInteractionForm = (formData: InteractionFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Validate required fields
  if (!isRequired(formData.title)) {
    errors.title = FORM_VALIDATION.REQUIRED_MESSAGE;
  } else if (!maxLength(formData.title, FORM_VALIDATION.MAX_TITLE_LENGTH)) {
    errors.title = `Title must be less than ${FORM_VALIDATION.MAX_TITLE_LENGTH} characters`;
  }
  
  if (!isRequired(formData.type)) {
    errors.type = FORM_VALIDATION.REQUIRED_MESSAGE;
  }
  
  if (!isRequired(formData.lead)) {
    errors.lead = FORM_VALIDATION.REQUIRED_MESSAGE;
  } else if (!maxLength(formData.lead, FORM_VALIDATION.MAX_LEAD_LENGTH)) {
    errors.lead = `Lead must be less than ${FORM_VALIDATION.MAX_LEAD_LENGTH} characters`;
  }
  
  if (!isRequired(formData.startDateTime)) {
    errors.startDateTime = FORM_VALIDATION.REQUIRED_MESSAGE;
  }
  
  if (!isRequired(formData.timezone)) {
    errors.timezone = FORM_VALIDATION.REQUIRED_MESSAGE;
  }
  
  if (!isRequired(formData.endDateTime)) {
    errors.endDateTime = FORM_VALIDATION.REQUIRED_MESSAGE;
  }
  
  // Validate date fields
  if (formData.startDateTime && !isValidDate(formData.startDateTime)) {
    errors.startDateTime = FORM_VALIDATION.DATE_VALIDATION.INVALID_DATE;
  }
  
  if (formData.endDateTime && !isValidDate(formData.endDateTime)) {
    errors.endDateTime = FORM_VALIDATION.DATE_VALIDATION.INVALID_DATE;
  }
  
  // Validate location length
  if (formData.location && !maxLength(formData.location, FORM_VALIDATION.MAX_LOCATION_LENGTH)) {
    errors.location = `Location must be less than ${FORM_VALIDATION.MAX_LOCATION_LENGTH} characters`;
  }
  
  // Validate description length
  if (formData.description && !maxLength(formData.description, FORM_VALIDATION.MAX_DESCRIPTION_LENGTH)) {
    errors.description = `Description must be less than ${FORM_VALIDATION.MAX_DESCRIPTION_LENGTH} characters`;
  }
  
  // Validate notes length
  if (formData.notes && !maxLength(formData.notes, FORM_VALIDATION.MAX_NOTES_LENGTH)) {
    errors.notes = `Notes must be less than ${FORM_VALIDATION.MAX_NOTES_LENGTH} characters`;
  }
  
  // Validate end date is after start date
  if (
    formData.startDateTime && 
    formData.endDateTime && 
    isValidDate(formData.startDateTime) && 
    isValidDate(formData.endDateTime) && 
    !isEndDateAfterStartDate(formData.startDateTime, formData.endDateTime)
  ) {
    errors.endDateTime = FORM_VALIDATION.DATE_VALIDATION.END_BEFORE_START;
  }
  
  return errors;
};

/**
 * Checks if validation errors object has any errors
 * 
 * @param errors - The validation errors object to check
 * @returns True if errors object has any errors, false otherwise
 */
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Validates if a string has at least the specified minimum length
 * 
 * @param value - The string to validate
 * @param min - The minimum length required
 * @returns True if string meets minimum length, false otherwise
 */
export const minLength = (value: string, min: number): boolean => {
  if (value === undefined || value === null) return false;
  return value.length >= min;
};

/**
 * Validates if a string does not exceed the specified maximum length
 * 
 * @param value - The string to validate
 * @param max - The maximum length allowed
 * @returns True if string doesn't exceed maximum length, false otherwise
 */
export const maxLength = (value: string, max: number): boolean => {
  if (value === undefined || value === null) return true;
  return value.length <= max;
};