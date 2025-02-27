import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.2
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '../ui/Table';

interface TableSkeletonProps {
  rowCount?: number;
  className?: string;
}

/**
 * Renders a single skeleton cell with a pulsing animation
 */
const SkeletonCell = ({ className = '' }: { className?: string }): JSX.Element => {
  return (
    <TableCell className="px-4 py-3">
      <div 
        className={classNames(
          'h-4 bg-gray-200 rounded animate-pulse',
          className
        )} 
      />
    </TableCell>
  );
};

/**
 * Renders a skeleton loading state for the Interaction table with animated placeholder rows
 */
const TableSkeleton = ({ 
  rowCount = 5, 
  className = ''
}: TableSkeletonProps): JSX.Element => {
  // Define column headers based on the Interaction table structure
  const columns = [
    { name: 'Title', width: 'w-full' },
    { name: 'Type', width: 'w-20' },
    { name: 'Lead', width: 'w-24' },
    { name: 'Date/Time', width: 'w-32' },
    { name: 'Timezone', width: 'w-24' },
    { name: 'Location', width: 'w-36' }
  ];

  return (
    <div className={classNames('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.name}
              </th>
            ))}
            <th scope="col" className="relative px-4 py-3"></th> {/* Actions column */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="bg-white border-b border-gray-200">
              {columns.map((column, colIndex) => (
                <SkeletonCell key={colIndex} className={column.width} />
              ))}
              <td className="px-4 py-3 text-right">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;