import React from 'react'; // v18.2.0
import classNames from 'classnames'; // v2.3.3
import Spinner from '../ui/Spinner';
import logo from '../../assets/images/logo.svg';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  showLogo?: boolean;
  className?: string;
}

/**
 * A shared component that displays a loading indicator with an optional message and logo.
 * Can be configured to take up the full screen or be contained within a parent element.
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  fullScreen = false,
  showLogo = false,
  className = '',
}) => {
  const containerClasses = classNames(
    'flex flex-col items-center justify-center p-4',
    {
      'fixed inset-0 z-50 bg-white dark:bg-gray-900': fullScreen,
    },
    className
  );

  return (
    <div 
      className={containerClasses}
      aria-busy="true"
    >
      {showLogo && (
        <div className="mb-4">
          <img src={logo} alt="Application Logo" className="h-16 w-auto" />
        </div>
      )}
      <Spinner size="lg" color="primary" />
      {message && <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>}
    </div>
  );
};

export default LoadingScreen;