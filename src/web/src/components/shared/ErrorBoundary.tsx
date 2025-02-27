import React, { Component, ErrorInfo, ReactNode } from 'react';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

interface ErrorBoundaryProps {
  /**
   * Content to render when no error has occurred
   */
  children: ReactNode;
  
  /**
   * Custom fallback UI to show when an error occurs
   * Can be a React node or a function that receives the error and reset function
   */
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  
  /**
   * Optional callback for error logging or monitoring
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * A component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the whole application.
 * 
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * @example
 * // With custom fallback UI
 * <ErrorBoundary
 *   fallback={<div>Something went wrong</div>}
 *   onError={(error) => logErrorToService(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * @example
 * // With function fallback for more control
 * <ErrorBoundary
 *   fallback={(error, resetError) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetError}>Reset</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    this.resetError = this.resetError.bind(this);
  }

  /**
   * Static lifecycle method called when a child component throws an error
   * Updates state to reflect that an error has occurred
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Lifecycle method called after an error has been thrown by a descendant component
   * Performs side effects like logging and error reporting
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack trace:', errorInfo.componentStack);
    }

    // Call the provided onError handler if it exists
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Resets the error state to allow re-rendering the child components
   */
  resetError(): void {
    this.setState({
      hasError: false,
      error: null
    });
  }

  /**
   * Renders either the error UI or the children based on the error state
   */
  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // If fallback is a function, call it with the error and resetError function
      if (typeof fallback === 'function') {
        return fallback(error, this.resetError);
      }

      // If fallback is a ReactNode, render it
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <Alert 
          variant="error" 
          title="Something went wrong"
        >
          <div className="space-y-4">
            <p>An unexpected error occurred while rendering this component.</p>
            {process.env.NODE_ENV !== 'production' && (
              <p className="text-sm font-mono bg-red-50 p-2 rounded">
                {error.message}
              </p>
            )}
            <div className="pt-2">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={this.resetError}
              >
                Try Again
              </Button>
            </div>
          </div>
        </Alert>
      );
    }

    return children;
  }
}

export default ErrorBoundary;