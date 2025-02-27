import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import DateTimeSelector from './DateTimeSelector';
import TypeSelector from './TypeSelector';
import ValidationErrors from './ValidationErrors';
import FormActions from './FormActions';
import DeleteConfirmation from './DeleteConfirmation';

import useForm from '../../hooks/useForm';
import useInteractions from '../../hooks/useInteractions';
import useSite from '../../hooks/useSite';
import useNotification from '../../hooks/useNotification';

import { Interaction, InteractionFormData, InteractionType } from '../../types/interactions';
import { ValidationError } from '../../types/api';

import FormField from '../ui/FormField';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Card from '../ui/Card';
import LoadingScreen from '../shared/LoadingScreen';

import { validateInteractionForm } from '../../utils/validation';
import { formatTimeForInput, combineDateAndTime } from '../../utils/date';
import { DEFAULT_INTERACTION_VALUES } from '../../utils/constants';

/**
 * Props for the InteractionForm component
 */
interface InteractionFormProps {
  /**
   * Initial data for editing an existing interaction
   * If not provided, the form will be in create mode
   */
  initialData?: Interaction | null;
  
  /**
   * Callback function called when the form is submitted
   */
  onSubmit?: (data: InteractionFormData) => Promise<void>;
  
  /**
   * Callback function called when the form is canceled
   */
  onCancel?: () => void;
  
  /**
   * Callback function called when an interaction is deleted
   */
  onDelete?: () => void;
  
  /**
   * Whether the form is currently in a submitting state
   */
  isSubmitting?: boolean;
  
  /**
   * Validation errors from the API to display
   */
  validationErrors?: ValidationError[];
  
  /**
   * Additional CSS classes to apply to the form container
   */
  className?: string;
}

/**
 * A form component for creating and editing Interaction records.
 * Provides fields for all required interaction properties and handles validation.
 */
const InteractionForm: React.FC<InteractionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  validationErrors,
  className = '',
}) => {
  // Hooks for navigation, notifications, site context
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { currentSite } = useSite();
  
  // Determine if we're in edit mode
  const isEdit = !!initialData;

  // Initialize date/time state
  const [startDate, setStartDate] = useState<Date | null>(
    initialData?.startDateTime ? new Date(initialData.startDateTime) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialData?.endDateTime ? new Date(initialData.endDateTime) : new Date(new Date().setHours(new Date().getHours() + 1))
  );
  const [startTime, setStartTime] = useState<string>(
    initialData?.startDateTime 
      ? formatTimeForInput(new Date(initialData.startDateTime)) 
      : formatTimeForInput(new Date())
  );
  const [endTime, setEndTime] = useState<string>(
    initialData?.endDateTime 
      ? formatTimeForInput(new Date(initialData.endDateTime)) 
      : formatTimeForInput(new Date(new Date().setHours(new Date().getHours() + 1)))
  );
  
  // State for delete confirmation modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  
  // Prepare initial form values
  const initialFormValues: InteractionFormData = {
    title: initialData?.title || '',
    type: (initialData?.type as InteractionType) || InteractionType.MEETING,
    lead: initialData?.lead || '',
    startDateTime: initialData?.startDateTime || new Date().toISOString(),
    endDateTime: initialData?.endDateTime || new Date(new Date().setHours(new Date().getHours() + 1)).toISOString(),
    timezone: initialData?.timezone || DEFAULT_INTERACTION_VALUES.timezone,
    location: initialData?.location || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
  };
  
  // Initialize form state using useForm hook
  const { 
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    isValid,
    isDirty,
  } = useForm<InteractionFormData>(
    initialFormValues,
    onSubmit,
    validateInteractionForm
  );

  // Update form with API validation errors if provided
  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      validationErrors.forEach(error => {
        setFieldError(error.field, error.message);
      });
    }
  }, [validationErrors, setFieldError]);

  /**
   * Handles changes to the start date
   */
  const handleStartDateChange = useCallback((date: Date | null) => {
    setStartDate(date);
    if (date) {
      const combinedDate = combineDateAndTime(date, startTime);
      if (combinedDate) {
        setFieldValue('startDateTime', combinedDate.toISOString());
      }
    }
  }, [startTime, setFieldValue]);

  /**
   * Handles changes to the end date
   */
  const handleEndDateChange = useCallback((date: Date | null) => {
    setEndDate(date);
    if (date) {
      const combinedDate = combineDateAndTime(date, endTime);
      if (combinedDate) {
        setFieldValue('endDateTime', combinedDate.toISOString());
      }
    }
  }, [endTime, setFieldValue]);

  /**
   * Handles changes to the start time
   */
  const handleStartTimeChange = useCallback((time: string) => {
    setStartTime(time);
    if (startDate) {
      const combinedDate = combineDateAndTime(startDate, time);
      if (combinedDate) {
        setFieldValue('startDateTime', combinedDate.toISOString());
      }
    }
  }, [startDate, setFieldValue]);

  /**
   * Handles changes to the end time
   */
  const handleEndTimeChange = useCallback((time: string) => {
    setEndTime(time);
    if (endDate) {
      const combinedDate = combineDateAndTime(endDate, time);
      if (combinedDate) {
        setFieldValue('endDateTime', combinedDate.toISOString());
      }
    }
  }, [endDate, setFieldValue]);

  /**
   * Handles changes to the timezone
   */
  const handleTimezoneChange = useCallback((timezone: string) => {
    setFieldValue('timezone', timezone);
  }, [setFieldValue]);

  /**
   * Handles form submission
   */
  const submitForm = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!currentSite) {
      showError('No active site selected');
      return;
    }

    await handleSubmit(e);
  }, [currentSite, handleSubmit, showError]);

  /**
   * Handles form cancellation
   */
  const handleFormCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/finder');
    }
  }, [onCancel, navigate]);

  /**
   * Handles save and new action
   * Submits the current form and then resets it for a new interaction
   */
  const handleSaveAndNew = useCallback(async () => {
    await submitForm();
    
    // Reset form for a new interaction
    resetForm({
      title: '',
      type: InteractionType.MEETING,
      lead: '',
      startDateTime: new Date().toISOString(),
      endDateTime: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString(),
      timezone: values.timezone, // Keep the same timezone
      location: '',
      description: '',
      notes: '',
    });
    
    // Reset date/time state
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000)); // Create a new date 1 hour later
    
    setStartDate(new Date());
    setEndDate(oneHourLater);
    setStartTime(formatTimeForInput(new Date()));
    setEndTime(formatTimeForInput(oneHourLater));
  }, [submitForm, resetForm, values.timezone]);

  /**
   * Shows the delete confirmation dialog
   */
  const handleDelete = useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  /**
   * Confirms deletion and calls the onDelete callback
   */
  const confirmDelete = useCallback(() => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirmation(false);
  }, [onDelete]);

  /**
   * Closes the delete confirmation dialog
   */
  const closeDeleteConfirmation = useCallback(() => {
    setShowDeleteConfirmation(false);
  }, []);

  // Render loading screen if still loading initial data in edit mode
  if (isEdit && !initialData) {
    return <LoadingScreen message="Loading interaction..." />;
  }

  return (
    <Card className={`interaction-form ${className}`}>
      <form onSubmit={submitForm} noValidate>
        <div className="space-y-6">
          {/* Show validation errors at the top */}
          <ValidationErrors errors={errors} />

          {/* Title Field */}
          <FormField
            label="Title"
            htmlFor="title"
            error={touched.title && errors.title}
            required
          >
            <Input
              id="title"
              name="title"
              value={values.title}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter interaction title"
              required
              data-testid="title-input"
            />
          </FormField>

          {/* Type and Lead Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TypeSelector
              id="type"
              name="type"
              value={values.type}
              onChange={(value) => setFieldValue('type', value)}
              error={touched.type && errors.type}
              required
            />

            <FormField
              label="Lead"
              htmlFor="lead"
              error={touched.lead && errors.lead}
              required
            >
              <Input
                id="lead"
                name="lead"
                value={values.lead}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Person leading the interaction"
                required
                data-testid="lead-input"
              />
            </FormField>
          </div>

          {/* Date/Time Selector Component */}
          <DateTimeSelector
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            timezone={values.timezone}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
            onTimezoneChange={handleTimezoneChange}
            error={
              (touched.startDateTime && errors.startDateTime) ||
              (touched.endDateTime && errors.endDateTime) ||
              (touched.timezone && errors.timezone)
            }
          />

          {/* Location Field */}
          <FormField
            label="Location"
            htmlFor="location"
            error={touched.location && errors.location}
          >
            <Input
              id="location"
              name="location"
              value={values.location}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter location (optional)"
              data-testid="location-input"
            />
          </FormField>

          {/* Description Field */}
          <FormField
            label="Description"
            htmlFor="description"
            error={touched.description && errors.description}
          >
            <TextArea
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter interaction description (optional)"
              rows={4}
              data-testid="description-input"
            />
          </FormField>

          {/* Notes Field */}
          <FormField
            label="Notes"
            htmlFor="notes"
            error={touched.notes && errors.notes}
          >
            <TextArea
              id="notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter additional notes (optional)"
              rows={3}
              data-testid="notes-input"
            />
          </FormField>

          {/* Form Actions */}
          <FormActions
            onSave={submitForm}
            onSaveAndNew={handleSaveAndNew}
            onCancel={handleFormCancel}
            onDelete={handleDelete}
            isSubmitting={isSubmitting}
            isEdit={isEdit}
            interaction={initialData}
          />
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={closeDeleteConfirmation}
        onDelete={confirmDelete}
        interaction={initialData}
      />
    </Card>
  );
};

export default InteractionForm;