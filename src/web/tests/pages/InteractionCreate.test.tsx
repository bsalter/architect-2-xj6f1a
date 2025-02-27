import React from 'react';
import userEvent from '@testing-library/user-event'; // v14.4.3
import render, { screen, waitFor } from '../utils/render';
import InteractionCreate from '../../src/pages/InteractionCreate';
import { mockSites, mockInteractions } from '../mocks/data';

// Mock the hooks
jest.mock('../../src/hooks/useInteractions', () => ({
  useCreateInteraction: jest.fn()
}));

jest.mock('../../src/hooks/useSite', () => jest.fn());
jest.mock('../../src/hooks/useNotification', () => jest.fn());

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

describe('InteractionCreate component', () => {
  // Setup mocks
  const mockNavigate = jest.fn();
  const mockMutateAsync = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure mocks for each test
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    
    require('../../src/hooks/useInteractions').useCreateInteraction.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false
    });
    
    require('../../src/hooks/useSite').mockReturnValue({
      currentSite: mockSites[0]
    });
    
    require('../../src/hooks/useNotification').mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError
    });
  });

  test('renders the form', () => {
    render(<InteractionCreate />);
    
    // Check for page title
    expect(screen.getByText('Create Interaction')).toBeInTheDocument();
    
    // Check for form fields
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
    expect(screen.getByTestId('lead-input')).toBeInTheDocument();
    expect(screen.getByTestId('location-input')).toBeInTheDocument();
    expect(screen.getByTestId('description-input')).toBeInTheDocument();
    expect(screen.getByTestId('notes-input')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-and-new-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    mockMutateAsync.mockResolvedValue({});
    
    const user = userEvent.setup();
    render(<InteractionCreate />);
    
    // Fill out the form
    await user.type(screen.getByTestId('title-input'), 'Test Interaction');
    await user.type(screen.getByTestId('lead-input'), 'Test Lead');
    
    // Submit the form
    await user.click(screen.getByTestId('save-button'));
    
    // Check that the API was called with the correct data
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Interaction',
          lead: 'Test Lead'
        })
      );
      
      expect(mockShowSuccess).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/finder');
    });
  });

  test('shows validation errors', async () => {
    const user = userEvent.setup();
    render(<InteractionCreate />);
    
    // Submit without filling required fields
    await user.click(screen.getByTestId('save-button'));
    
    // Check for validation error messages
    await waitFor(() => {
      const errors = screen.getAllByText(/required/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test('handles API errors', async () => {
    const mockError = { 
      message: 'API Error', 
      details: [{ field: 'title', message: 'Title already exists' }] 
    };
    mockMutateAsync.mockRejectedValue(mockError);
    
    const user = userEvent.setup();
    render(<InteractionCreate />);
    
    // Fill out the form
    await user.type(screen.getByTestId('title-input'), 'Test Interaction');
    await user.type(screen.getByTestId('lead-input'), 'Test Lead');
    
    // Submit the form
    await user.click(screen.getByTestId('save-button'));
    
    // Check error handling
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('API Error'));
    });
  });

  test('handles cancellation', async () => {
    const user = userEvent.setup();
    render(<InteractionCreate />);
    
    // Click the cancel button
    await user.click(screen.getByTestId('cancel-button'));
    
    // Check that we navigated to the finder
    expect(mockNavigate).toHaveBeenCalledWith('/finder');
  });

  test('associates with current site', async () => {
    mockMutateAsync.mockResolvedValue({});
    
    const user = userEvent.setup();
    render(<InteractionCreate />);
    
    // Fill out the form
    await user.type(screen.getByTestId('title-input'), 'Test Interaction');
    await user.type(screen.getByTestId('lead-input'), 'Test Lead');
    
    // Submit the form
    await user.click(screen.getByTestId('save-button'));
    
    // Check that the API was called with the current site context
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      expect(require('../../src/hooks/useSite')).toHaveBeenCalled();
    });
  });
});