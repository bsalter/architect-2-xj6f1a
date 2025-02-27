import React from 'react'; // react v18.2.0
import { FinderPage } from '../../src/pages/FinderPage';
import { render, screen, waitFor } from '../utils/render';
import { mockInteractions, mockSites } from '../mocks/data';
import { server } from '../mocks/server';
import { rest } from 'msw'; // msw v1.2.1
import userEvent from '@testing-library/user-event'; // @testing-library/user-event v14.4.3
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // vitest v0.32.0
import { SiteContext } from '../../src/context/SiteContext';

/**
 * Test suite for FinderPage component
 * @version 1.0.0
 */
describe('FinderPage', () => {
  /**
   * Setup function that runs before each test
   * @version 1.0.0
   */
  beforeEach(() => {
    // Setup mock server handlers for interactions API
    server.use(
      rest.get('/api/interactions', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ status: 'success', data: { interactions: mockInteractions, meta: { pagination: { page: 1, pageSize: 25, totalPages: 1, totalRecords: mockInteractions.length } } } }));
      })
    );

    // Setup userEvent for simulating user interactions
    userEvent.setup();
  });

  /**
   * Cleanup function that runs after each test
   * @version 1.0.0
   */
  afterEach(() => {
    // Reset mock server handlers
    server.resetHandlers();
  });

  /**
   * Tests that the FinderPage component renders correctly
   * @version 1.0.0
   */
  it('renders the FinderPage component', async () => {
    // Render the FinderPage component using custom render
    render(<FinderPage />);

    // Wait for the interaction table to load
    await waitFor(() => {
      expect(screen.getByText('Interactions')).toBeInTheDocument();
    });

    // Assert that page header contains 'Interactions'
    expect(screen.getByRole('heading', { name: /Interactions/i })).toBeInTheDocument();

    // Assert that New Interaction button is present
    expect(screen.getByRole('button', { name: /New Interaction/i })).toBeInTheDocument();

    // Assert that search input is present
    expect(screen.getByRole('searchbox', { name: /Search interactions/i })).toBeInTheDocument();

    // Assert that interaction table displays expected columns and data
    expect(screen.getByRole('columnheader', { name: /Title/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Lead/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Date\/Time/i })).toBeInTheDocument();
  });

  /**
   * Tests the search functionality in FinderPage
   * @version 1.0.0
   */
  it('tests search functionality', async () => {
    // Render the FinderPage component
    render(<FinderPage />);

    // Setup mock for search API response
    server.use(
      rest.get('/api/interactions', (req, res, ctx) => {
        const searchTerm = req.url.searchParams.get('search');
        const filteredInteractions = mockInteractions.filter(interaction =>
          interaction.title.toLowerCase().includes(searchTerm?.toLowerCase() || '')
        );
        return res(ctx.status(200), ctx.json({ status: 'success', data: { interactions: filteredInteractions, meta: { pagination: { page: 1, pageSize: 25, totalPages: 1, totalRecords: filteredInteractions.length } } } }));
      })
    );

    // Type search text in search input
    const searchInput = screen.getByRole('searchbox', { name: /Search interactions/i });
    await userEvent.type(searchInput, 'Client Meeting');

    // Wait for search API to be called
    await waitFor(() => {
      expect(searchInput).toHaveValue('Client Meeting');
    });

    // Assert that the table displays filtered results
    await waitFor(() => {
      expect(screen.getByText('Client Meeting')).toBeInTheDocument();
    });

    // Assert that only interactions matching search criteria are shown
    expect(screen.queryByText('Team Update')).not.toBeInTheDocument();
  });

  /**
   * Tests navigation to create new interaction page
   * @version 1.0.0
   */
  it('tests navigation to create new interaction page', async () => {
    // Mock the useNavigate hook from react-router
    const navigate = vi.fn();
    vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigate);

    // Render the FinderPage component
    render(<FinderPage />);

    // Click the New Interaction button
    const newInteractionButton = screen.getByRole('button', { name: /New Interaction/i });
    await userEvent.click(newInteractionButton);

    // Assert that navigation was called with the correct path
    expect(navigate).toHaveBeenCalledWith('/interactions/new');
  });

  /**
   * Tests the advanced filtering functionality
   * @version 1.0.0
   */
  it('tests advanced filtering', async () => {
    // Render the FinderPage component
    render(<FinderPage />);

    // Click the Advanced Filters button
    const advancedFiltersButton = screen.getByRole('button', { name: /Show Filters/i });
    await userEvent.click(advancedFiltersButton);

    // Select filter options (type, date range, etc.)
    const typeSelect = screen.getByRole('combobox', { name: /Type/i });
    await userEvent.selectOptions(typeSelect, 'MEETING');

    // Click Apply Filters button
    const applyFiltersButton = screen.getByRole('button', { name: /Apply Filters/i });
    await userEvent.click(applyFiltersButton);

    // Assert that API was called with correct filter parameters
    await waitFor(() => {
      expect(screen.getByText('Client Meeting')).toBeInTheDocument();
    });

    // Assert that filtered results are displayed correctly
    expect(screen.queryByText('Team Update')).not.toBeInTheDocument();
  });

  /**
   * Tests navigation to edit an interaction
   * @version 1.0.0
   */
  it('tests navigation to edit an interaction', async () => {
    // Mock the useNavigate hook from react-router
    const navigate = vi.fn();
    vi.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(navigate);

    // Render the FinderPage component
    render(<FinderPage />);

    // Wait for interaction table to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Client Meeting/i })).toBeInTheDocument();
    });

    // Click edit button on an interaction row
    const editButton = screen.getByRole('button', { name: /Edit Client Meeting/i });
    await userEvent.click(editButton);

    // Assert that navigation was called with the correct edit path and ID
    expect(navigate).toHaveBeenCalledWith('/interactions/1/edit');
  });

  /**
   * Tests the delete interaction confirmation flow
   * @version 1.0.0
   */
  it('tests the delete interaction confirmation flow', async () => {
    // Render the FinderPage component
    render(<FinderPage />);

    // Wait for interaction table to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Client Meeting/i })).toBeInTheDocument();
    });

    // Mock server to handle delete request
    server.use(
      rest.delete('/api/interactions/1', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ status: 'success', data: { success: true } }));
      })
    );

    // Click edit button on an interaction row
    const editButton = screen.getByRole('button', { name: /Edit Client Meeting/i });
    await userEvent.click(editButton);

    // Assert confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Confirm Delete/i })).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByRole('button', { name: /Delete/i });
    await userEvent.click(confirmButton);

    // Assert delete API was called
    await waitFor(() => {
      expect(screen.getByText(/Interaction "Client Meeting" was successfully deleted./i)).toBeInTheDocument();
    });

    // Assert success notification shown
    expect(screen.getByText(/Interaction "Client Meeting" was successfully deleted./i)).toBeVisible();

    // Assert interaction removed from table
    expect(screen.queryByText(/Client Meeting/i)).toBeNull();
  });

  /**
   * Tests that interactions are filtered by site context
   * @version 1.0.0
   */
  it('tests that interactions are filtered by site context', async () => {
    // Mock SiteContext with specific site value
    const siteId = 2;
    const wrapper = ({ children }) => (
      <SiteContext.Provider value={{ currentSite: mockSites.find(site => site.id === siteId), userSites: mockSites, loading: false, error: null, setSite: vi.fn() }}>
        {children}
      </SiteContext.Provider>
    );

    // Setup mock server to handle interactions API with siteId
    server.use(
      rest.get('/api/interactions', (req, res, ctx) => {
        const reqSiteId = parseInt(req.headers.get('X-Site-Context') || '1', 10);
        const filteredInteractions = mockInteractions.filter(interaction => interaction.siteId === reqSiteId);
        return res(ctx.status(200), ctx.json({ status: 'success', data: { interactions: filteredInteractions, meta: { pagination: { page: 1, pageSize: 25, totalPages: 1, totalRecords: filteredInteractions.length } } } }));
      })
    );

    // Render the FinderPage component
    render(<FinderPage />, { wrapper });

    // Assert that API was called with site_id parameter
    await waitFor(() => {
      expect(screen.getByText(/Sales Team Meeting/i)).toBeInTheDocument();
    });

    // Assert that only interactions from current site are displayed
    expect(screen.queryByText(/Client Meeting/i)).toBeNull();
  });

  /**
   * Tests pagination functionality
   * @version 1.0.0
   */
  it('tests pagination', async () => {
    // Setup mock server with paginated response
    server.use(
      rest.get('/api/interactions', (req, res, ctx) => {
        const page = parseInt(req.url.searchParams.get('page') || '1', 10);
        const pageSize = parseInt(req.url.searchParams.get('pageSize') || '25', 10);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedInteractions = mockInteractions.slice(startIndex, endIndex);
        return res(ctx.status(200), ctx.json({ status: 'success', data: { interactions: paginatedInteractions, meta: { pagination: { page, pageSize, totalPages: 2, totalRecords: mockInteractions.length } } } }));
      })
    );

    // Render the FinderPage component
    render(<FinderPage />);

    // Assert pagination controls are present
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next page/i })).toBeInTheDocument();
    });

    // Click next page button
    const nextPageButton = screen.getByRole('button', { name: /Next page/i });
    await userEvent.click(nextPageButton);

    // Assert API called with updated page parameter
    await waitFor(() => {
      expect(screen.getByText(/Sales Team Meeting/i)).toBeInTheDocument();
    });

    // Assert next page of interactions is displayed
    expect(screen.queryByText(/Client Meeting/i)).toBeNull();
  });

  /**
   * Tests loading state display during API calls
   * @version 1.0.0
   */
  it('tests loading state', async () => {
    // Setup mock server with delayed response
    server.use(
      rest.get('/api/interactions', async (req, res, ctx) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res(ctx.status(200), ctx.json({ status: 'success', data: { interactions: mockInteractions, meta: { pagination: { page: 1, pageSize: 25, totalPages: 1, totalRecords: mockInteractions.length } } } }));
      })
    );

    // Render the FinderPage component
    render(<FinderPage />);

    // Assert loading indicator is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for response to complete
    await waitFor(() => {
      expect(screen.getByText(/Client Meeting/i)).toBeInTheDocument();
    });

    // Assert loading indicator is replaced with interaction table
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});