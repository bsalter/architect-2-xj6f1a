import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react'; // react v18.2.0
import { debounce } from 'lodash'; // lodash v4.17.21
import Input from '../ui/Input';
import Button from '../ui/Button';
import useSite from '../../hooks/useSite';

/**
 * Props for the SearchBar component
 */
export interface SearchBarProps {
  /**
   * Initial value for the search input
   */
  initialValue?: string;
  
  /**
   * Callback function triggered when search is performed
   * This callback should implement the search across all interaction fields
   * as per requirement F-007-RQ-001
   * @param term The search term entered by the user
   */
  onSearch: (term: string) => void;
  
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;
  
  /**
   * Whether to trigger search automatically as the user types
   * @default true
   */
  autoSearch?: boolean;
  
  /**
   * Delay in milliseconds before triggering auto-search while typing
   * @default 500
   */
  searchDelay?: number;
}

/**
 * SearchBar component that provides a search interface for the Interaction Finder
 * 
 * This component captures search terms from the user and triggers the search callback.
 * It supports the requirement to search across all interaction fields (F-007-RQ-001)
 * by providing a clean UI for entering search terms, which are then passed to the parent
 * component to implement the actual search functionality.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  onSearch,
  placeholder = 'Search interactions...',
  autoSearch = true,
  searchDelay = 500
}) => {
  // State for the search term
  const [searchTerm, setSearchTerm] = useState<string>(initialValue);
  
  // Access site context to ensure we're operating in the correct site context
  const { currentSite } = useSite();
  
  // Create a debounced search function to prevent excessive API calls while typing
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      // Pass the search term to the parent component
      // The parent component should implement the search across all fields
      onSearch(term);
    }, searchDelay),
    [onSearch, searchDelay]
  );
  
  // Update search term when initialValue changes
  useEffect(() => {
    if (initialValue !== searchTerm) {
      setSearchTerm(initialValue);
    }
  }, [initialValue, searchTerm]);
  
  /**
   * Handles the change event when the user types in the search input
   * @param e Change event from the input element
   */
  const handleSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If autoSearch is enabled, trigger the debounced search
    if (autoSearch) {
      debouncedSearch(value);
    }
  };
  
  /**
   * Handles the form submission when the user clicks the search button or presses Enter
   * @param e Form submit event
   */
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  /**
   * Clears the current search term and notifies the parent component
   */
  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };
  
  return (
    <form 
      onSubmit={handleSearchSubmit}
      className="flex items-center"
      role="search"
      aria-label="Search interactions"
    >
      <div className="relative flex-grow">
        <Input
          type="search"
          id="interaction-search"
          name="search"
          value={searchTerm}
          onChange={handleSearchInputChange}
          placeholder={placeholder}
          fullWidth
          aria-label="Search term"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        className="ml-2"
        aria-label="Search"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
export { SearchBarProps };