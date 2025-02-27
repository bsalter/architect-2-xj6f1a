import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2
import { Button } from '../ui/Button';

/**
 * Interface defining the props for the Pagination component
 */
interface PaginationProps {
  /**
   * Current active page (1-based)
   */
  currentPage: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Total count of items across all pages
   */
  totalItems: number;
  
  /**
   * Number of items per page
   */
  pageSize: number;
  
  /**
   * Callback when page is changed
   */
  onPageChange: (page: number) => void;
  
  /**
   * Callback when page size is changed
   */
  onPageSizeChange: (size: number) => void;
  
  /**
   * Whether data is currently loading
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Optional CSS class for custom styling
   */
  className?: string;
}

/**
 * A component that renders pagination controls including previous/next buttons,
 * current page indicator, and page size selector.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  className = '',
}) => {
  // Function to handle page change, validates the page number is within bounds
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange(page);
  };

  // Function to handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value, 10);
    onPageSizeChange(newSize);
  };

  // Function to render page numbers with ellipsis for large page counts
  const renderPageNumbers = () => {
    // Handle edge cases
    if (totalPages <= 0) return null;
    if (totalPages === 1) {
      return (
        <Button
          variant="primary"
          size="sm"
          disabled={true}
          aria-current="page"
          aria-label="Page 1"
        >
          1
        </Button>
      );
    }
    
    // Define how many page numbers to show around the current page
    const maxVisiblePages = 5;
    const pageNumbers: Array<number | 'ellipsis'> = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    if (totalPages <= maxVisiblePages) {
      // If total pages is small, show all pages
      for (let i = 2; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // For large page counts, show selected pages with ellipsis
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;
      
      // Calculate which pages to show based on current page
      if (currentPage <= leftSide + 1) {
        // Near the start
        for (let i = 2; i <= maxVisiblePages - 1; i++) {
          if (i < totalPages) pageNumbers.push(i);
        }
        if (totalPages > maxVisiblePages) pageNumbers.push('ellipsis');
        if (totalPages > 1) pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - rightSide) {
        // Near the end
        pageNumbers.push('ellipsis');
        for (let i = totalPages - maxVisiblePages + 2; i < totalPages; i++) {
          if (i > 1) pageNumbers.push(i);
        }
        if (totalPages > 1) pageNumbers.push(totalPages);
      } else {
        // Middle
        pageNumbers.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          if (i > 1 && i < totalPages) pageNumbers.push(i);
        }
        pageNumbers.push('ellipsis');
        if (totalPages > 1) pageNumbers.push(totalPages);
      }
    }
    
    // Render page buttons or ellipsis
    return pageNumbers.map((page, index) => {
      if (page === 'ellipsis') {
        return (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
            ...
          </span>
        );
      }
      
      return (
        <Button
          key={`page-${page}`}
          variant={currentPage === page ? 'primary' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(page)}
          disabled={isLoading || currentPage === page}
          aria-current={currentPage === page ? 'page' : undefined}
          aria-label={`Page ${page}`}
          className="mx-1"
        >
          {page}
        </Button>
      );
    });
  };

  // Main page size options
  const pageSizeOptions = [10, 25, 50, 100];

  // Determine if pagination navigation should be disabled
  const isPaginationDisabled = totalPages <= 1 || isLoading;

  return (
    <div 
      className={classNames(
        'flex flex-col sm:flex-row items-center justify-between py-4 gap-4',
        className
      )}
      data-testid="pagination"
    >
      <div className="flex flex-col sm:flex-row sm:items-center">
        <span className="text-sm text-gray-700 mb-2 sm:mb-0">
          {totalItems === 0 ? (
            <span>No results found</span>
          ) : (
            <>
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalItems)}
              </span> of <span className="font-medium">{totalItems}</span> results
            </>
          )}
        </span>
        
        <div className="sm:ml-4">
          <label htmlFor="pageSize" className="sr-only">Items per page</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isPaginationDisabled}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            data-testid="page-size-select"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <nav aria-label="Pagination" className="inline-flex">
        <ul className="flex items-center">
          <li>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isPaginationDisabled}
              aria-label="Previous page"
              data-testid="previous-page-button"
              className="rounded-l-md"
            >
              Previous
            </Button>
          </li>
          
          <li className="hidden sm:flex items-center mx-2">
            {renderPageNumbers()}
          </li>
          
          <li className="sm:hidden flex items-center px-4">
            <span className="text-sm">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
          </li>
          
          <li>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isPaginationDisabled}
              aria-label="Next page"
              data-testid="next-page-button"
              className="rounded-r-md"
            >
              Next
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;