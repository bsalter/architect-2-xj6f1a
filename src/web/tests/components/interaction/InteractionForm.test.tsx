import React from 'react';
import { render, screen, waitFor } from '../../utils/render';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '../../mocks/server';
import InteractionForm from '../../../src/components/interaction/InteractionForm';
import { mockInteractions } from '../../mocks/data';
import { jest } from '@jest/globals';

describe('InteractionForm', () => {
  beforeEach(() => {
    // Reset any runtime handlers
    server.resetHandlers();
  });

  it('should render empty form for creating new interaction', async () => {
    render(<InteractionForm />);

    // Check for field inputs which should always be present
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
    expect(screen.getByTestId('lead-input')).toBeInTheDocument();
    expect(screen.getByTestId('location-input')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('notes-input')).toBeInTheDocument();

    // Check that title and lead fields are empty (these are required)
    expect(screen.getByTestId('title-input')).toHaveValue('');
    expect(screen.getByTestId('lead-input')).toHaveValue('');

    // Check for save and cancel buttons
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();

    // In create mode, there should be no delete button
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
  });

  it('should populate form with initial data for editing', async () => {
    // Get a sample interaction from mock data
    const sampleInteraction = mockInteractions[0];

    render(<InteractionForm initialData={sampleInteraction} />);

    // Check that fields are populated with the correct values
    expect(screen.getByTestId('title-input')).toHaveValue(sampleInteraction.title);
    expect(screen.getByTestId('lead-input')).toHaveValue(sampleInteraction.lead);
    expect(screen.getByTestId('location-input')).toHaveValue(sampleInteraction.location);
    expect(screen.getByTestId('description-input')).toHaveValue(sampleInteraction.description);
    expect(screen.getByTestId('notes-input')).toHaveValue(sampleInteraction.notes);

    // In edit mode, there should be a delete button
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<InteractionForm />);

    // Clear fields (in case there are default values)
    await userEvent.clear(screen.getByTestId('title-input'));
    await userEvent.clear(screen.getByTestId('lead-input'));

    // Submit the form without filling required fields
    await userEvent.click(screen.getByTestId('save-button'));

    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/lead is required/i)).toBeInTheDocument();
    });

    // Verify form was not submitted (we're still on the form page)
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
  });

  it('should validate date range', async () => {
    render(<InteractionForm />);

    // Fill in required fields
    await userEvent.type(screen.getByTestId('title-input'), 'Test Meeting');
    await userEvent.type(screen.getByTestId('lead-input'), 'John Doe');

    // Set end date before start date to trigger validation error
    // Find the date inputs
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    await userEvent.clear(startDateInput);
    await userEvent.type(startDateInput, '2023-12-31');
    
    await userEvent.clear(endDateInput);
    await userEvent.type(endDateInput, '2023-12-30');

    // Submit the form
    await userEvent.click(screen.getByTestId('save-button'));

    // Check for date validation error
    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument();
    });
  });

  it('should handle form submission for new interaction', async () => {
    // Create mock onSubmit function
    const onSubmit = jest.fn();
    
    render(<InteractionForm onSubmit={onSubmit} />);

    // Fill in required fields
    await userEvent.type(screen.getByTestId('title-input'), 'New Test Meeting');
    await userEvent.type(screen.getByTestId('lead-input'), 'John Doe');
    
    // Submit the form
    await userEvent.click(screen.getByTestId('save-button'));

    // Verify onSubmit was called with the form data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Test Meeting',
          lead: 'John Doe'
        })
      );
    });
  });

  it('should handle form submission for editing', async () => {
    // Create mock onSubmit function
    const onSubmit = jest.fn();
    
    // Get a sample interaction from mock data
    const sampleInteraction = mockInteractions[0];
    
    render(<InteractionForm initialData={sampleInteraction} onSubmit={onSubmit} />);

    // Modify a field
    await userEvent.clear(screen.getByTestId('title-input'));
    await userEvent.type(screen.getByTestId('title-input'), 'Updated Meeting Title');

    // Submit the form
    await userEvent.click(screen.getByTestId('save-button'));

    // Verify onSubmit was called with the updated data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Meeting Title',
          lead: sampleInteraction.lead
        })
      );
    });
  });

  it('should handle cancellation', async () => {
    // Create mock onCancel function
    const onCancel = jest.fn();
    
    render(<InteractionForm onCancel={onCancel} />);

    // Fill in a field to create unsaved changes
    await userEvent.type(screen.getByTestId('title-input'), 'Test Meeting');

    // Click the cancel button
    await userEvent.click(screen.getByTestId('cancel-button'));

    // Verify onCancel was called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should show delete confirmation dialog', async () => {
    // Get a sample interaction
    const sampleInteraction = mockInteractions[0];
    
    render(<InteractionForm initialData={sampleInteraction} />);

    // Click the delete button
    await userEvent.click(screen.getByTestId('delete-button'));

    // Check that confirmation dialog appears
    expect(screen.getByText(/are you sure you want to delete this interaction/i)).toBeInTheDocument();
    expect(screen.getByText(sampleInteraction.title)).toBeInTheDocument();
    
    // Check for confirm and cancel buttons in the dialog
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should handle delete confirmation', async () => {
    // Create mock onDelete function
    const onDelete = jest.fn();
    
    // Get a sample interaction
    const sampleInteraction = mockInteractions[0];
    
    render(<InteractionForm initialData={sampleInteraction} onDelete={onDelete} />);

    // Click the delete button to show confirmation
    await userEvent.click(screen.getByTestId('delete-button'));

    // Click the confirm button in the dialog
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    // Verify onDelete was called
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  it('should cancel deletion when requested', async () => {
    // Create mock onDelete function
    const onDelete = jest.fn();
    
    // Get a sample interaction
    const sampleInteraction = mockInteractions[0];
    
    render(<InteractionForm initialData={sampleInteraction} onDelete={onDelete} />);

    // Click the delete button to show confirmation
    await userEvent.click(screen.getByTestId('delete-button'));

    // Click the cancel button in the dialog
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Verify onDelete was not called
    expect(onDelete).not.toHaveBeenCalled();
    
    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByText(/are you sure you want to delete this interaction/i)).not.toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    // Create mock onSubmit that doesn't resolve immediately
    const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    // Render with isSubmitting=true to simulate loading state
    render(<InteractionForm onSubmit={onSubmit} isSubmitting={true} />);

    // Check that save button shows loading state
    expect(screen.getByTestId('save-button')).toHaveAttribute('disabled');
    
    // Check that form fields are disabled during submission
    expect(screen.getByTestId('title-input')).toHaveAttribute('disabled');
  });

  it('should handle server-side validation errors', async () => {
    // Set up validation errors prop
    const validationErrors = [{ field: 'title', message: 'Title must be unique' }];
    
    render(<InteractionForm validationErrors={validationErrors} />);

    // Check for validation error message
    expect(screen.getByText(/title must be unique/i)).toBeInTheDocument();
  });
});