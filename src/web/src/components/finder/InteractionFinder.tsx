import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import SearchBar from './SearchBar';
import AdvancedFilters from './AdvancedFilters';
import InteractionTable from './InteractionTable';
import TableSkeleton from './TableSkeleton';
import FilterPanel from './FilterPanel';
import SortSelector from './SortSelector';
import Pagination from '../ui/Pagination';
import Button from '../ui/Button';
import Card from '../ui/Card';

import useInteractions from '../../hooks/useInteractions';
import useSite from '../../hooks/useSite';
import { 
  Interaction, 
  SearchParams, 
  FilterCriteria, 
  SortOption, 
  InteractionSortField, 
  SortDirection 
} from '../../types/interactions';

/**
 * The main component that provides the interface for finding, filtering, and navigating to interaction records.
 * 
 * Implements the requirements:
 * - F-006-RQ-001: Displays interactions in a tabular format showing all required fields
 * - F-007-RQ-001: Provides search functionality across all interaction fields
 * - F-002-RQ-002: Filters all interaction data based on user's site access
 */
const InteractionFinder: React.FC = () => {
  const navigate = useNavigate();
  const { currentSite } = useSite();
  
  // State for search parameters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortField, setSortField] = useState<string>(InteractionSortField.START_DATE);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);
  
  // Use the hook to fetch interactions based on our search params
  const {
    interactions,
    isLoading,
    totalCount
  } = useInteractions();
  
  /**
   * Handles changes to the search term and updates the search parameters
   */
  const handleSearch = (term: string): void => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when search changes
  };
  
  /**
   * Handles changes to the filter criteria and updates the search parameters
   */
  const handleFilterChange = (filterCriteria: FilterCriteria): void => {
    setFilters(filterCriteria);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  /**
   * Clears all active filters
   */
  const handleFilterClear = (): void => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1); // Reset to first page
  };
  
  /**
   * Handles changes to the sort field or direction
   */
  const handleSortChange = (sortOption: SortOption): void => {
    setSortField(sortOption.field);
    setSortDirection(sortOption.direction as SortDirection);
  };
  
  /**
   * Handles pagination page changes
   */
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };
  
  /**
   * Handles changes to the number of items displayed per page
   */
  const handlePageSizeChange = (size: number): void => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  /**
   * Navigates to the interaction creation page
   */
  const handleCreateNew = (): void => {
    navigate('/interactions/new');
  };
  
  /**
   * Handles clicking on a table row to edit an interaction
   */
  const handleRowClick = (id: number): void => {
    navigate(`/interactions/${id}/edit`);
  };
  
  /**
   * Prepares search parameters object for API requests
   */
  const getSearchParams = (): SearchParams => {
    return {
      search: searchTerm,
      filters,
      sortField,
      sortDirection,
      page: currentPage,
      pageSize
    };
  };
  
  /**
   * Renders a message when no interactions match the current search/filters
   */
  const renderEmptyState = (): JSX.Element => {
    const hasActiveFilters = !!searchTerm || Object.keys(filters).length > 0;
    
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">
          {hasActiveFilters ? 'No matching interactions found' : 'No interactions found'}
        </h2>
        <p className="text-gray-500 mb-6">
          {hasActiveFilters 
            ? 'Try adjusting your search criteria or filters'
            : 'Create your first interaction to get started'}
        </p>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={handleFilterClear}
            className="mr-4"
          >
            Clear Filters
          </Button>
        )}
        <Button variant="primary" onClick={handleCreateNew}>
          Create New Interaction
        </Button>
      </div>
    );
  };

  return (
    <div className="interaction-finder">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Interactions</h1>
        <Button 
          variant="primary" 
          onClick={handleCreateNew}
          data-testid="create-interaction-button"
        >
          Create New Interaction
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="mb-4">
            <SearchBar 
              initialValue={searchTerm} 
              onSearch={handleSearch} 
              placeholder="Search interactions..."
            />
          </div>
          
          <FilterPanel
            filters={getSearchParams()}
            onApplyFilters={(params) => {
              if (params.filters) {
                handleFilterChange(params.filters);
              }
            }}
            onClearFilters={handleFilterClear}
            initialExpanded={Object.keys(filters).length > 0}
          />
          
          <div className="mt-4 flex justify-end">
            <SortSelector
              field={sortField}
              direction={sortDirection}
              onSortChange={(field, direction) => 
                handleSortChange({ field, direction })
              }
              availableFields={Object.values(InteractionSortField)}
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <TableSkeleton />
      ) : interactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <InteractionTable
            data={interactions}
            isLoading={isLoading}
            totalCount={totalCount}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={(field, direction) => 
              handleSortChange({ field, direction })
            }
            onRowClick={handleRowClick}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
          
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / pageSize)}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default InteractionFinder;