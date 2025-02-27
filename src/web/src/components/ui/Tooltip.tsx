import React, { useState, useRef, useEffect, forwardRef } from 'react';
import classNames from 'classnames'; // v2.3.2

/**
 * Props for the Tooltip component
 */
interface TooltipProps {
  /** Content to display inside the tooltip */
  content: React.ReactNode;
  /** Position of the tooltip relative to the triggering element */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Element that triggers the tooltip */
  children: React.ReactNode;
  /** Additional class name for the tooltip container */
  className?: string;
  /** Additional class name for the tooltip popup */
  tooltipClassName?: string;
  /** Delay in milliseconds before showing the tooltip */
  delay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

/**
 * A tooltip component that provides additional information when hovering over or focusing on elements.
 * Supports different positions, custom styling, and is fully accessible.
 */
const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({
  content,
  position = 'top',
  children,
  className = '',
  tooltipClassName = '',
  delay = 300,
  disabled = false,
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);
  
  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(false);
  };

  // For accessibility - handle keyboard focus
  const handleFocus = handleMouseEnter;
  const handleBlur = handleMouseLeave;

  // Determine the positioning class
  const positionClass = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-1',
  }[position];

  // Arrow positioning
  const arrowClass = {
    top: 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent',
    right: 'left-[-5px] top-1/2 transform -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'top-[-5px] left-1/2 transform -translate-x-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-5px] top-1/2 transform -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent',
  }[position];

  return (
    <div 
      ref={ref}
      className={classNames('inline-block relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-describedby={isVisible && !disabled ? tooltipId.current : undefined}
    >
      {children}
      
      {isVisible && !disabled && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={classNames(
            'absolute z-50 px-3 py-2 text-sm text-white bg-slate-800 rounded shadow-md whitespace-nowrap',
            positionClass,
            tooltipClassName
          )}
        >
          {content}
          <div
            className={classNames(
              'absolute w-0 h-0 border-4',
              arrowClass
            )}
          />
        </div>
      )}
    </div>
  );
});

// Add display name for better debugging in React DevTools
Tooltip.displayName = 'Tooltip';

export default Tooltip;