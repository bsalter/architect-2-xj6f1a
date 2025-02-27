import React, { useState, useRef, useEffect } from 'react'; // react v18.2.0
import { Link } from 'react-router-dom'; // react-router-dom v6.14.2
import classNames from 'classnames'; // classnames v2.3.2
import useAuth from '../../hooks/useAuth';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { UserIcon, LogoutIcon } from '../../assets/icons';

/**
 * Custom hook to detect clicks outside of a referenced element
 * 
 * @param ref - React ref object pointing to the element to monitor
 * @param callback - Function to call when a click outside is detected
 */
const useOutsideClick = (ref: React.RefObject<HTMLElement>, callback: () => void): void => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
};

/**
 * UserMenu component displays a dropdown with user information and account options
 * 
 * This component shows the currently logged in user's information and provides
 * links to their profile page and a logout button.
 */
const UserMenu: React.FC = () => {
  // Get user data and logout function from auth context
  const { user, logout } = useAuth();
  
  // State to track if the dropdown is open
  const [isOpen, setIsOpen] = useState(false);
  
  // Reference to the dropdown container for outside click detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Toggle the dropdown menu
  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };
  
  // Use the outside click hook to close the menu when clicking elsewhere
  useOutsideClick(dropdownRef, () => {
    if (isOpen) setIsOpen(false);
  });
  
  // If there's no user, don't render anything
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User icon/avatar that toggles the dropdown */}
      <button
        onClick={toggleMenu}
        className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-controls="user-menu"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
          <UserIcon className="w-5 h-5" />
        </div>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <Card
          className="absolute right-0 mt-2 w-56 z-10"
          variant="elevated"
          padding="p-0"
          id="user-menu"
        >
          <div className="p-3">
            {/* User information */}
            <div className="mb-3 border-b border-gray-200 pb-3">
              <p className="font-medium text-gray-800">{user.username}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            
            {/* Navigation options */}
            <div className="space-y-2">
              <Link 
                to="/profile" 
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                My Profile
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<LogoutIcon className="w-4 h-4" />}
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
              >
                Log Out
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserMenu;