import React from 'react';
import { render, screen, waitFor } from '../../utils/render';
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.4.3
import SiteSelector from '../../../src/components/layout/SiteSelector';
import { mockSites } from '../../mocks/data';
import useSite from '../../../src/hooks/useSite';

// Mock the useSite hook
jest.mock('../../../src/hooks/useSite');

describe('SiteSelector component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useSite as jest.Mock).mockReturnValue({
      currentSite: null,
      userSites: [],
      loading: false,
      changeSite: jest.fn(),
      setDefaultSite: jest.fn()
    });
  });

  test('renders the current site name', async () => {
    // Mock the useSite hook to return a current site
    (useSite as jest.Mock).mockReturnValue({
      currentSite: mockSites[0],
      userSites: [mockSites[0]],
      loading: false,
      changeSite: jest.fn(),
      setDefaultSite: jest.fn()
    });

    render(<SiteSelector />);
    
    // Check that the site name is displayed
    expect(screen.getByText(mockSites[0].name)).toBeInTheDocument();
  });

  test('renders a dropdown when multiple sites are available', async () => {
    // Mock the useSite hook to return multiple sites
    (useSite as jest.Mock).mockReturnValue({
      currentSite: mockSites[0],
      userSites: mockSites.slice(0, 3), // First 3 mock sites
      loading: false,
      changeSite: jest.fn(),
      setDefaultSite: jest.fn()
    });

    render(<SiteSelector />);
    
    // Check that a select element is rendered
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check that all site options are available
    mockSites.slice(0, 3).forEach(site => {
      expect(screen.getByText(site.name)).toBeInTheDocument();
    });
  });

  test('does not render a dropdown when only one site is available', async () => {
    // Mock the useSite hook to return only one site
    (useSite as jest.Mock).mockReturnValue({
      currentSite: mockSites[0],
      userSites: [mockSites[0]],
      loading: false,
      changeSite: jest.fn(),
      setDefaultSite: jest.fn()
    });

    render(<SiteSelector />);
    
    // Check that no select element is rendered
    const select = screen.queryByRole('combobox');
    expect(select).not.toBeInTheDocument();
    
    // Check that the single site name is displayed
    expect(screen.getByText(mockSites[0].name)).toBeInTheDocument();
  });

  test('changes site on selection', async () => {
    // Create mock functions
    const mockChangeSite = jest.fn();
    const mockSetDefaultSite = jest.fn();
    
    // Mock the useSite hook to return multiple sites
    (useSite as jest.Mock).mockReturnValue({
      currentSite: mockSites[0],
      userSites: mockSites.slice(0, 3), // First 3 mock sites
      loading: false,
      changeSite: mockChangeSite,
      setDefaultSite: mockSetDefaultSite
    });

    render(<SiteSelector />);
    
    // Get the select element
    const select = screen.getByRole('combobox');
    
    // Simulate selecting a different site
    await userEvent.selectOptions(select, mockSites[1].id.toString());
    
    // Check that changeSite was called with the correct site ID
    expect(mockChangeSite).toHaveBeenCalledWith(mockSites[1].id);
  });

  test('sets default site', async () => {
    // Create mock functions
    const mockChangeSite = jest.fn();
    const mockSetDefaultSite = jest.fn();
    
    // Mock the useSite hook to return multiple sites
    (useSite as jest.Mock).mockReturnValue({
      currentSite: mockSites[0],
      userSites: mockSites.slice(0, 3), // First 3 mock sites
      loading: false,
      changeSite: mockChangeSite,
      setDefaultSite: mockSetDefaultSite
    });

    render(<SiteSelector showDefaultOption={true} />);
    
    // Get the checkbox
    const checkbox = screen.getByLabelText('Set as default site');
    
    // Check the checkbox
    await userEvent.click(checkbox);
    
    // Get the select element
    const select = screen.getByRole('combobox');
    
    // Simulate selecting a different site
    await userEvent.selectOptions(select, mockSites[1].id.toString());
    
    // Check that changeSite was called with the correct site ID
    expect(mockChangeSite).toHaveBeenCalledWith(mockSites[1].id);
    
    // Check that setDefaultSite was called with the correct parameters
    expect(mockSetDefaultSite).toHaveBeenCalledWith(mockSites[1].id, true);
  });

  test('shows loading state', async () => {
    // Mock the useSite hook to return loading state
    (useSite as jest.Mock).mockReturnValue({
      currentSite: null,
      userSites: [],
      loading: true,
      changeSite: jest.fn(),
      setDefaultSite: jest.fn()
    });

    render(<SiteSelector />);
    
    // Check that a loading spinner is displayed
    expect(screen.getByText(/loading sites/i)).toBeInTheDocument();
    
    // No site selection should be available during loading
    const select = screen.queryByRole('combobox');
    expect(select).not.toBeInTheDocument();
  });

  test('renders with custom className', async () => {
    // Mock the useSite hook to return a site
    (useSite as jest.Mock).mockReturnValue({
      currentSite: mockSites[0],
      userSites: [mockSites[0]],
      loading: false,
      changeSite: jest.fn(),
      setDefaultSite: jest.fn()
    });

    const customClass = 'custom-class';
    render(<SiteSelector className={customClass} />);
    
    // Check that the custom class is applied
    const container = screen.getByText(mockSites[0].name).closest('div');
    expect(container).toHaveClass(customClass);
  });
});