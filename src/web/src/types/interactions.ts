/**
 * TypeScript type definitions for interaction entities and related data structures
 * used throughout the application. This file defines the core Interaction entity and
 * supporting types for managing, searching, and displaying interactions.
 */

import { ValidationError, PaginationMeta } from './api';
import { Site } from './sites';

/**
 * Enumeration of possible interaction types
 */
export enum InteractionType {
  MEETING = 'MEETING',
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  UPDATE = 'UPDATE',
  REVIEW = 'REVIEW',
  TRAINING = 'TRAINING'
}

/**
 * Core interface representing an interaction entity with all its properties
 */
export interface Interaction {
  id: number;
  title: string;
  type: InteractionType;
  lead: string;
  startDateTime: string;
  timezone: string;
  endDateTime: string;
  location: string;
  description: string;
  notes: string;
  siteId: number;
  site: Site | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedBy: number | null;
  updatedByName: string | null;
  updatedAt: string | null;
}

/**
 * Interface representing data needed to create or update an interaction
 */
export interface InteractionFormData {
  title: string;
  type: InteractionType;
  lead: string;
  startDateTime: string;
  timezone: string;
  endDateTime: string;
  location: string;
  description: string;
  notes: string;
}

/**
 * Interface for field-specific filters in the Finder view
 */
export interface InteractionSearchFilters {
  title?: string;
  type?: InteractionType;
  lead?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

/**
 * Enumeration of fields that can be used for sorting interactions
 */
export enum InteractionSortField {
  TITLE = 'title',
  TYPE = 'type',
  LEAD = 'lead',
  START_DATE = 'startDateTime',
  END_DATE = 'endDateTime',
  LOCATION = 'location',
  CREATED_AT = 'createdAt'
}

/**
 * Enumeration of sort directions
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Complete search parameters for the Interaction Finder view
 */
export interface InteractionSearchParams {
  search?: string;
  filters?: InteractionSearchFilters;
  sortField?: InteractionSortField;
  sortDirection?: SortDirection;
  page: number;
  pageSize: number;
}

/**
 * Response structure when listing interactions with pagination
 */
export interface InteractionListResponse {
  interactions: Interaction[];
  meta: PaginationMeta;
}

/**
 * Response structure when retrieving a single interaction
 */
export interface InteractionResponse {
  interaction: Interaction;
}

/**
 * Statistics about interactions for dashboard or summary views
 */
export interface InteractionStats {
  total: number;
  byType: Record<InteractionType, number>;
  byMonth: Record<string, number>;
  byLead: Record<string, number>;
}

/**
 * Structure for validation errors when creating or updating interactions
 */
export interface InteractionValidationErrors {
  errors: ValidationError[];
}