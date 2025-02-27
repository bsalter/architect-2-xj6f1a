import React from 'react'; // react ^18.2.0
import { render, screen, waitFor } from '../../utils/render';
import userEvent from '@testing-library/user-event'; // @testing-library/user-event ^14.4.3
import SearchBar from '../../../../src/components/finder/SearchBar';

describe('SearchBar', () => {
  it('renders correctly with default props', () => {
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    // Verify search input is in the document
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    
    // Verify search button is in the document with correct text
    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
    
    // Check that the input has the correct default placeholder
    expect(searchInput).toHaveAttribute('placeholder', 'Search interactions...');
  });

  it('uses custom placeholder when provided', () => {
    const handleSearch = jest.fn();
    const customPlaceholder = 'Find interactions...';
    render(<SearchBar onSearch={handleSearch} placeholder={customPlaceholder} />);
    
    // Verify the input has the custom placeholder text
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('placeholder', customPlaceholder);
  });

  it('displays the initialValue when provided', () => {
    const handleSearch = jest.fn();
    const initialValue = 'initial search term';
    render(<SearchBar onSearch={handleSearch} initialValue={initialValue} />);
    
    // Verify the input displays the provided initial value
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveValue(initialValue);
  });

  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    const searchInput = screen.getByRole('searchbox');
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Type a search term
    await user.type(searchInput, 'test search');
    
    // Click the search button
    await user.click(searchButton);
    
    // Verify onSearch was called with the correct search term
    expect(handleSearch).toHaveBeenCalledWith('test search');
  });

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} />);
    
    const searchInput = screen.getByRole('searchbox');
    
    // Type a search term and press Enter
    await user.type(searchInput, 'test search{Enter}');
    
    // Verify onSearch was called with the correct search term
    expect(handleSearch).toHaveBeenCalledWith('test search');
  });

  it('calls onSearch when autoSearch is enabled and user types', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} autoSearch={true} searchDelay={100} />);
    
    const searchInput = screen.getByRole('searchbox');
    
    // Type a search term
    await user.type(searchInput, 'auto search');
    
    // Wait for debounce time plus a small buffer
    await waitFor(() => expect(handleSearch).toHaveBeenCalledWith('auto search'), {
      timeout: 150
    });
  });

  it('respects custom searchDelay for autoSearch', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    const customDelay = 300;
    render(
      <SearchBar 
        onSearch={handleSearch} 
        autoSearch={true} 
        searchDelay={customDelay} 
      />
    );
    
    const searchInput = screen.getByRole('searchbox');
    
    // Type a search term
    await user.type(searchInput, 'delayed search');
    
    // Verify onSearch is not called immediately
    expect(handleSearch).not.toHaveBeenCalled();
    
    // Wait for custom delay time
    await waitFor(() => expect(handleSearch).toHaveBeenCalledWith('delayed search'), {
      timeout: customDelay + 50
    });
  });

  it('clears search and calls onSearch with empty string when input is cleared', async () => {
    const user = userEvent.setup();
    const handleSearch = jest.fn();
    render(<SearchBar onSearch={handleSearch} initialValue="initial value" />);
    
    const searchInput = screen.getByRole('searchbox');
    
    // Verify the initial value is set
    expect(searchInput).toHaveValue('initial value');
    
    // Clear the input field
    await user.clear(searchInput);
    
    // Find and click the clear button (using aria-label)
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);
    
    // Verify the input is empty
    expect(searchInput).toHaveValue('');
    
    // Verify onSearch was called with an empty string
    expect(handleSearch).toHaveBeenCalledWith('');
  });

  it('updates when initialValue prop changes', () => {
    const handleSearch = jest.fn();
    const { rerender } = render(
      <SearchBar onSearch={handleSearch} initialValue="first value" />
    );
    
    // Verify the initial value
    expect(screen.getByRole('searchbox')).toHaveValue('first value');
    
    // Re-render with a different initialValue
    rerender(
      <SearchBar onSearch={handleSearch} initialValue="updated value" />
    );
    
    // Verify the input displays the new value
    expect(screen.getByRole('searchbox')).toHaveValue('updated value');
  });
});