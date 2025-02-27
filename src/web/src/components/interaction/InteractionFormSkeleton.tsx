import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.3
import Card from '../ui/Card';

interface InteractionFormSkeletonProps {
  className?: string;
}

/**
 * Creates a skeleton placeholder for a form field
 * @param height - Optional custom height for the skeleton
 * @param width - Optional custom width for the skeleton
 * @param className - Additional CSS classes
 * @returns A skeleton representation of a form field
 */
const SkeletonField = ({ 
  height = 'h-10',
  width = 'w-full', 
  className = ''
}: { 
  height?: string;
  width?: string;
  className?: string;
}) => {
  return (
    <div
      className={classNames(
        'bg-gray-200 rounded animate-pulse',
        height,
        width,
        className
      )}
    />
  );
};

/**
 * Creates a skeleton placeholder for a form label
 * @param className - Additional CSS classes
 * @returns A skeleton representation of a form label
 */
const SkeletonLabel = ({ className = '' }: { className?: string }) => {
  return (
    <div
      className={classNames(
        'bg-gray-200 rounded animate-pulse h-4 w-1/4 mb-1',
        className
      )}
    />
  );
};

/**
 * Renders a skeleton placeholder for the InteractionForm
 * Provides visual feedback to users while the form data is being loaded.
 * The skeleton layout mimics the structure of the actual InteractionForm
 * with placeholders for all fields and buttons.
 */
const InteractionFormSkeleton: React.FC<InteractionFormSkeletonProps> = ({ 
  className = ''
}) => {
  return (
    <Card className={classNames('w-full', className)}>
      <div className="space-y-6">
        {/* Title field */}
        <div className="space-y-1">
          <SkeletonLabel />
          <SkeletonField />
        </div>

        {/* Type and Lead fields (in a row) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <SkeletonLabel />
            <SkeletonField />
          </div>
          <div className="space-y-1">
            <SkeletonLabel />
            <SkeletonField />
          </div>
        </div>

        {/* Date/Time fields with timezone (in a row) */}
        <div className="space-y-1">
          <SkeletonLabel />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>

        {/* Location field */}
        <div className="space-y-1">
          <SkeletonLabel />
          <SkeletonField />
        </div>

        {/* Description field (taller than regular inputs) */}
        <div className="space-y-1">
          <SkeletonLabel />
          <SkeletonField height="h-24" />
        </div>

        {/* Notes field (taller than regular inputs) */}
        <div className="space-y-1">
          <SkeletonLabel />
          <SkeletonField height="h-24" />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <SkeletonField width="w-24" className="bg-gray-300" />
          <SkeletonField width="w-32" className="bg-gray-300" />
          <SkeletonField width="w-24" className="bg-gray-300" />
        </div>
      </div>
    </Card>
  );
};

export default InteractionFormSkeleton;