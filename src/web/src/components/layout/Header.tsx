import React, { useState, useEffect } from 'react'; // react v18.2.0
import { Link } from 'react-router-dom'; // react-router-dom v6.14.2

// Internal imports
import SiteSelector from './SiteSelector';
import UserMenu from './UserMenu';
import useAuth from '../../hooks/useAuth';
import useSite from '../../hooks/useSite';
import Button from '../ui/Button';
import logo from '../../assets/images/logo.svg';

/**
 * Main header component that displays application logo, site selector, and user menu
 * 
 * @returns {JSX.Element} The rendered header component
 */
const Header: React.FC = () => {
  // Get authentication state and user data using the useAuth hook
  const { isAuthenticated } = useAuth();
  
  // Get current site data using the useSite hook
  const { currentSite } = useSite();
  
  // State for mobile menu (open/closed)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Handle window resize events to adjust responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Close mobile menu on larger screens
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);
  
  // Toggle mobile menu state
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with link to finder page */}
          <div className="flex-shrink-0">
            <Link to="/finder" className="flex items-center">
              <img
                className="h-8 w-auto"
                src={logo}
                alt="Interaction Management System"
              />
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated && (
              <SiteSelector className="mr-4" />
            )}
            
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Log In
                </Button>
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              onClick={toggleMobileMenu}
              variant="outline"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated && (
              <div className="px-3 py-2">
                <SiteSelector />
              </div>
            )}
            
            {isAuthenticated ? (
              <div className="px-3 py-2">
                <UserMenu />
              </div>
            ) : (
              <Link to="/login" className="block px-3 py-2">
                <Button variant="primary" size="sm" className="w-full">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;