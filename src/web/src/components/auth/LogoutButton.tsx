import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // react-router-dom v6.14.2
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import useNotification from '../../hooks/useNotification';
import { LogoutIcon } from '../../assets/icons';

/**
 * Props for the LogoutButton component
 */
interface LogoutButtonProps {
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Visual style variant of the button
   * @default 'outline'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'link';
  
  /**
   * Size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A button component that provides a logout function for users
 * 
 * This component handles terminating the user's authenticated session 
 * through the auth context, showing appropriate loading states and 
 * notifications, and redirecting to the login page.
 */
const LogoutButton: React.FC<LogoutButtonProps> = ({
  className,
  variant = 'outline',
  size = 'md'
}) => {
  // State to track loading status during logout
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks for navigation and auth functionality
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  /**
   * Handles the logout process, calling the logout function from the auth hook
   * and managing the loading state
   */
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logout();
      showSuccess('Logged out successfully');
      navigate('/login');
    } catch (error) {
      showError('Failed to log out. Please try again.');
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      isLoading={isLoading}
      className={className}
      leftIcon={<LogoutIcon />}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;