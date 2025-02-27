import React, { ReactNode, useEffect, useState } from 'react'; // v18.2.0

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => any);
  cell?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  className?: string;
  responsiveHidden?: boolean;
  primary?: boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  keyExtractor?: (item: T, index: number) => string | number;
  rowActions?: (item: T) => ReactNode;
  ariaLabel?: string;
  viewMode?: 'auto' | 'desktop' | 'mobile';
}

const Table = <T extends object>({
  data,
  columns,
  isLoading = false,
  sortField,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
  rowClassName = '',
  keyExtractor = (item, index) => index,
  rowActions,
  ariaLabel = 'Data table',
  viewMode = 'auto',
}: TableProps<T>): JSX.Element => {
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile view for 'auto' viewMode
  useEffect(() => {
    if (viewMode !== 'auto') return;

    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, [viewMode]);

  // Determine if we should use the mobile view based on props and viewport
  const useMobileView = viewMode === 'mobile' || (viewMode === 'auto' && isMobileView);

  // Handle column sorting
  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;

    const accessor = typeof column.accessor === 'function' 
      ? 'unknown' 
      : String(column.accessor);
    
    const newDirection = 
      sortField === accessor && sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(accessor, newDirection);
  };

  // Render table header cells with sort indicators
  const renderHeaderCell = (column: TableColumn<T>, index: number) => {
    const isSorted = typeof column.accessor !== 'function' && 
      sortField === String(column.accessor);
    
    const headerClassName = `
      px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
      ${column.className || ''}
      ${column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
      ${column.responsiveHidden ? 'hidden md:table-cell' : ''}
    `.trim();

    return (
      <th 
        key={index}
        scope="col"
        className={headerClassName}
        onClick={() => column.sortable && handleSort(column)}
        aria-sort={isSorted ? sortDirection : undefined}
      >
        <div className="flex items-center space-x-1">
          <span>{column.header}</span>
          {column.sortable && isSorted && (
            <span aria-hidden="true">
              {sortDirection === 'asc' ? ' ↑' : ' ↓'}
            </span>
          )}
        </div>
      </th>
    );
  };

  // Render table data cells
  const renderCell = (item: T, column: TableColumn<T>, rowIndex: number, colIndex: number) => {
    const cellClassName = `
      px-4 py-3 text-sm text-gray-900
      ${column.className || ''}
      ${column.responsiveHidden ? 'hidden md:table-cell' : ''}
    `.trim();

    return (
      <td key={colIndex} className={cellClassName}>
        {getCellValue(item, column, rowIndex)}
      </td>
    );
  };

  // Get CSS classes for a row
  const getRowClassName = (item: T, index: number) => {
    const baseClass = 'bg-white border-b border-gray-200 hover:bg-gray-50';
    const customClass = typeof rowClassName === 'function' 
      ? rowClassName(item, index) 
      : rowClassName;
    const clickableClass = onRowClick ? 'cursor-pointer' : '';
    
    return `${baseClass} ${customClass} ${clickableClass}`.trim();
  };

  // Get formatted cell value
  const getCellValue = (item: T, column: TableColumn<T>, index: number): ReactNode => {
    if (column.cell) {
      return column.cell(item, index);
    }

    if (typeof column.accessor === 'function') {
      const value = column.accessor(item);
      return value ?? '';
    }

    const value = item[column.accessor];
    return value !== null && value !== undefined ? String(value) : '';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view
  if (useMobileView) {
    return (
      <div className="space-y-4" aria-label={ariaLabel}>
        {data.map((item, index) => {
          const key = keyExtractor(item, index);
          
          return (
            <div
              key={key}
              className={`bg-white rounded-lg shadow p-4 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(item)}
            >
              {columns
                .filter(column => !column.responsiveHidden)
                .map((column, colIndex) => {
                  const isPrimary = column.primary;
                  const value = getCellValue(item, column, index);
                  
                  if (isPrimary) {
                    return (
                      <div key={colIndex} className="text-lg font-medium mb-2">
                        {value}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={colIndex} className="grid grid-cols-2 py-1 border-b border-gray-100 last:border-0">
                      <div className="text-sm font-medium text-gray-500">
                        {column.header}
                      </div>
                      <div className="text-sm text-gray-900">
                        {value}
                      </div>
                    </div>
                  );
                })}
              
              {rowActions && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                  {rowActions(item)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200" aria-label={ariaLabel}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map(renderHeaderCell)}
            {rowActions && <th scope="col" className="relative px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, rowIndex) => {
            const key = keyExtractor(item, rowIndex);
            
            return (
              <tr 
                key={key} 
                className={getRowClassName(item, rowIndex)}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column, colIndex) => 
                  renderCell(item, column, rowIndex, colIndex)
                )}
                
                {rowActions && (
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {rowActions(item)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;