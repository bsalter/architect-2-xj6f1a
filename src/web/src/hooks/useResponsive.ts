import { useState, useEffect, useCallback } from 'react'; // React 18.2.0

/**
 * Breakpoint constants for responsive design
 */
const BREAKPOINTS = {
  MOBILE: 767,   // Max width for mobile is 767px
  TABLET: 1199,  // Max width for tablet is 1199px
  DESKTOP: 1200, // Min width for desktop is 1200px
};

/**
 * Type definition for the object returned by useResponsive
 */
interface ResponsiveInfo {
  /** Current window width in pixels */
  width: number;
  /** Current window height in pixels */
  height: number;
  /** True if current breakpoint is mobile (width <= 767px) */
  isMobile: boolean;
  /** True if current breakpoint is tablet (768px <= width <= 1199px) */
  isTablet: boolean;
  /** True if current breakpoint is desktop (width >= 1200px) */
  isDesktop: boolean;
  /** Current breakpoint name: 'mobile', 'tablet', or 'desktop' */
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

/**
 * A custom React hook that provides responsive design utilities by tracking 
 * window dimensions and determining the current breakpoint.
 * 
 * Breakpoints:
 * - Mobile: width <= 767px
 * - Tablet: 768px <= width <= 1199px
 * - Desktop: width >= 1200px
 * 
 * @returns An object containing window dimensions and breakpoint information.
 */
export const useResponsive = (): ResponsiveInfo => {
  // Initialize state with default values
  // We'll use window values if available, otherwise default to desktop size
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.DESKTOP,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  // Create a memoized function to update dimensions to avoid unnecessary re-renders
  const handleResize = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    // Only add listeners if window exists (for SSR compatibility)
    if (typeof window !== 'undefined') {
      // Update dimensions immediately
      handleResize();
      
      // Add event listener for window resize
      window.addEventListener('resize', handleResize);
      
      // Clean up event listener on component unmount
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [handleResize]);

  // Determine current breakpoint based on window width
  const isMobile = dimensions.width <= BREAKPOINTS.MOBILE;
  const isTablet = dimensions.width > BREAKPOINTS.MOBILE && dimensions.width <= BREAKPOINTS.TABLET;
  const isDesktop = dimensions.width >= BREAKPOINTS.DESKTOP;
  
  // Derive current breakpoint name
  let breakpoint: 'mobile' | 'tablet' | 'desktop';
  if (isMobile) {
    breakpoint = 'mobile';
  } else if (isTablet) {
    breakpoint = 'tablet';
  } else {
    breakpoint = 'desktop';
  }

  // Return all necessary responsive information
  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
};