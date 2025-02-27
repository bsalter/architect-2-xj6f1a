import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';

import { render, screen, waitFor } from '../utils/render';
import InteractionEdit from '../../src/pages/InteractionEdit';
import { mockInteractions } from '../mocks/data';
import { server } from '../mocks/server';
import { API_ENDPOINTS } from '../../src/utils/constants';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

/**
 * Helper function to render the InteractionEdit component with router context
 * 
 * @param interactionId - The ID of the interaction to edit
 * @returns The rendered component with testing utilities
 */
const renderInteractionEdit = (interactionId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/interactions/edit/${interactionId}`]}>
      <Routes>
        <Route path="/interactions/edit/:id" element={<InteractionEdit />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('InteractionEdit Component', () => {
  beforeEach(() => {
    // Reset the navigate mock before each test
    mockNavigate.mockReset();
    
    // Reset any custom handlers
    server.resetHandlers();
  });

  it('renders loading state initially', async () => {
    renderInteractionEdit('1');
    
    // Check if loading indicator is visible
    expect(screen.getByText(/loading interaction/i)).toBeInTheDocument();
    
    // Wait for loading to finish to avoid test interference
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
  });

  it('loads and displays interaction data', async () => {
    renderInteractionEdit('1');
    
    // Mock interaction data from our test data
    const mockInteraction = mockInteractions[0];
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Check if form is populated with the correct data
    expect(screen.getByDisplayValue(mockInteraction.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockInteraction.lead)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockInteraction.location)).toBeInTheDocument();
    // The date and time fields would need specific tests based on formatting
  });

  it('handles form submission successfully', async () => {
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Modify a field
    const titleInput = screen.getByTestId('title-input');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    
    // Submit the form
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);
    
    // Wait for submission and check navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/finder');
    });
  });

  it('displays validation errors on form submission', async () => {
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Clear required fields to trigger validation errors
    const titleInput = screen.getByTestId('title-input');
    const leadInput = screen.getByTestId('lead-input');
    
    await user.clear(titleInput);
    await user.clear(leadInput);
    
    // Submit the form
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);
    
    // Check if validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    });
  });

  it('handles API validation errors', async () => {
    // Setup custom server handler to return validation errors
    server.use(
      rest.put(`${API_ENDPOINTS.INTERACTIONS.DETAILS('1')}`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { field: 'title', message: 'Title is already taken' }
              ]
            }
          })
        );
      })
    );
    
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Submit the form
    const saveButton = screen.getByTestId('save-button');
    await user.click(saveButton);
    
    // Check if API validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/title is already taken/i)).toBeInTheDocument();
    });
  });

  it('handles non-existent interaction gracefully', async () => {
    // Setup custom server handler to return 404
    server.use(
      rest.get(`${API_ENDPOINTS.INTERACTIONS.DETAILS('999')}`, (req, res, ctx) => {
        return res(
          ctx.status(404),
          ctx.json({
            status: 'error',
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Interaction not found'
            }
          })
        );
      })
    );
    
    renderInteractionEdit('999');
    
    // Check if not found message is displayed
    await waitFor(() => {
      expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Setup custom server handler to return server error
    server.use(
      rest.get(`${API_ENDPOINTS.INTERACTIONS.DETAILS('1')}`, (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Internal server error'
            }
          })
        );
      })
    );
    
    renderInteractionEdit('1');
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load interaction/i)).toBeInTheDocument();
    });
  });

  it('handles cancellation and returns to finder', async () => {
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Click cancel button
    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);
    
    // Check if navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/finder');
  });

  it('displays delete confirmation dialog', async () => {
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);
    
    // Check if confirmation dialog is shown
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('handles interaction deletion successfully', async () => {
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);
    
    // Wait for dialog and confirm deletion
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    await user.click(confirmButton);
    
    // Check if navigation occurs
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/finder');
    });
  });

  it('handles deletion errors gracefully', async () => {
    // Setup custom server handler to return error on deletion
    server.use(
      rest.delete(`${API_ENDPOINTS.INTERACTIONS.DETAILS('1')}`, (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error deleting interaction'
            }
          })
        );
      })
    );
    
    const user = userEvent.setup();
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);
    
    // Wait for dialog and confirm deletion
    const confirmButton = await screen.findByRole('button', { name: /delete/i });
    await user.click(confirmButton);
    
    // Check if error notification is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to delete/i)).toBeInTheDocument();
    });
  });

  it('respects site-scoping when fetching interaction', async () => {
    // Setup custom server handler to verify site context header is present
    let siteContextVerified = false;
    
    server.use(
      rest.get(`${API_ENDPOINTS.INTERACTIONS.DETAILS('1')}`, (req, res, ctx) => {
        // Verify the X-Site-Context header is present
        const siteContext = req.headers.get('X-Site-Context');
        siteContextVerified = siteContext !== null;
        
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              interaction: {
                ...mockInteractions[0],
                siteId: Number(siteContext) || 1
              }
            }
          })
        );
      })
    );
    
    renderInteractionEdit('1');
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading interaction/i)).not.toBeInTheDocument();
      expect(screen.getByDisplayValue(mockInteractions[0].title)).toBeInTheDocument();
      expect(siteContextVerified).toBeTruthy();
    });
  });
});