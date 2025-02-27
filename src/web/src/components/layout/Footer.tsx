import React from 'react';
import classNames from 'classnames'; // v2.3.2
import { Link } from 'react-router-dom'; // v6.10.0

/**
 * Footer component that provides consistent copyright information, links to important resources,
 * and application version display across the Interaction Management System.
 * 
 * @returns {JSX.Element} The rendered footer component
 */
const Footer: React.FC = () => {
  // Get current year dynamically for copyright notice
  const currentYear = new Date().getFullYear();
  
  const linkClasses = classNames(
    'text-blue-600 hover:text-blue-800',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
  );
  
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6 mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          <div className="mb-3 md:mb-0 text-gray-600 text-sm">
            &copy; {currentYear} Interaction Management System. All rights reserved.
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link to="/terms-of-service" className={linkClasses}>
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className={linkClasses}>
              Privacy Policy
            </Link>
            <Link to="/help" className={linkClasses}>
              Help & Support
            </Link>
            <span className="text-gray-500 ml-2">
              Version: {process.env.REACT_APP_VERSION || '1.0.0'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;