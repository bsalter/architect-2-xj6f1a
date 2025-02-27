import React, { useState } from 'react';
import classnames from 'classnames'; // v2.3.2
import Table, { TableColumn } from '../ui/Table';
import Pagination from '../ui/Pagination';
import InteractionTableRow from './InteractionTableRow';
import EmptyState from './EmptyState';
import TableSkeleton from './TableSkeleton';
import { formatDateTime } from '../../utils/date';
import {
  Interaction,
  InteractionSortField,
  SortDirection,
} from '../../types/interactions';
import {
  TABLE_CONSTANTS
} from '../../utils/constants';

const { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, INTERACTION_COLUMNS } = TABLE_CONSTANTS;

/**
 * Props interface for the InteractionTable component
 */
interface InteractionTableProps {
  /**
   * Array of interaction data to display in the table
   */
  data: Interaction[];
  
  /**
   * Whether data is currently being loaded
   */
  isLoading: boolean;
  
  /**
   * Total count of all interactions matching the current filters
   */
  totalCount: number;
  
  /**
   * Field name to sort by
   */
  sortField: string;
  
  /**
   * Sort direction (asc or desc)
   */
  sortDirection: SortDirection;
  
  /**
   * Callback function when sort field or direction changes
   */
  onSort: (field: string, direction: SortDirection) => void;
  
  /**
   * Callback function when a row is clicked
   */
  onRowClick: (id: number) => void;
  
  /**
   * Current page number (1-based)
   */
  currentPage: number;
  
  /**
   * Number of items per page
   */
  pageSize: number;
  
  /**
   * Callback function when page changes
   */
  onPageChange: (page: number) => void;
  
  /**
   * Callback function when page size changes
   */
  onPageSizeChange: (size: number) => void;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Component that displays interaction data in a table format with sorting and pagination
 * This is a core component of the Finder interface that shows all required fields of interactions.
 */
const InteractionTable: React.FC<InteractionTableProps> = ({
  data,
  isLoading,
  totalCount,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  // State to track the currently selected row
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  /**
   * Handles column header click for sorting
   * @param field - The field to sort by
   */
  const handleSort = (field: string) => {
    const newDirection = 
      field === sortField && sortDirection === SortDirection.ASC
        ? SortDirection.DESC
        : SortDirection.ASC;
    
    onSort(field, newDirection);
  };

  /**
   * Handles row click event
   * @param interaction - The interaction data for the clicked row
   */
  const handleRowClick = (interaction: Interaction) => {
    setSelectedRowId(interaction.id);
    onRowClick(interaction.id);
  };

  /**
   * Renders pagination controls for the table
   */
  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return (
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  };

  /**
   * Creates table column configuration
   * @returns Array of column configurations
   */
  const getColumnConfig = (): Array<TableColumn<Interaction>> => {
    return [
      {
        header: 'Title',
        accessor: 'title',
        sortable: true,
        primary: true,
      },
      {
        header: 'Type',
        accessor: 'type',
        sortable: true,
      },
      {
        header: 'Lead',
        accessor: 'lead',
        sortable: true,
      },
      {
        header: 'Date/Time',
        accessor: 'startDateTime',
        sortable: true,
        cell: (interaction) => formatDateTime(
          interaction.startDateTime,
          interaction.timezone
        ),
      },
      {
        header: 'Timezone',
        accessor: 'timezone',
        sortable: false,
        responsiveHidden: true,
      },
      {
        header: 'Location',
        accessor: 'location',
        sortable: true,
      },
      {
        header: 'Actions',
        accessor: 'id',
        sortable: false,
        cell: (interaction) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(interaction.id);
            }}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="edit-interaction-button"
            aria-label={`Edit ${interaction.title}`}
          >
            Edit
          </button>
        ),
      },
    ];
  };

  // Show loading skeleton during data fetch
  if (isLoading) {
    return <TableSkeleton className={className} />;
  }

  // Show empty state when no data is available
  if (!data.length) {
    return (
      <EmptyState
        hasFilters={!!sortField}
        onClearFilters={() => {
          // Reset sort to default
          onSort(TABLE_CONSTANTS.DEFAULT_SORT_FIELD, SortDirection.DESC);
        }}
        onCreateNew={() => {
          // Navigate to create new interaction
          window.location.href = '/interactions/new';
        }}
        canCreateInteraction={true} // This should be based on user permissions in a real implementation
      />
    );
  }

  // Render the table with data
  return (
    <div className={classnames('interaction-table', className)} data-testid="interaction-table">
      <Table
        data={data}
        columns={getColumnConfig()}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={handleRowClick}
        keyExtractor={(item) => item.id}
        className="border rounded-md overflow-hidden"
        ariaLabel="Interactions Table"
      />
      {renderPagination()}
    </div>
  );
};

export default InteractionTable;