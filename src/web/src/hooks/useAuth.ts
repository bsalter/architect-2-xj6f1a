import { useContext } from 'react'; // react v18.2.0
import { AuthContext, AuthContextData } from '../context/AuthContext';
import { LoginCredentials, User } from '../types/auth';

/**
 * Custom hook that provides access to authentication state and functionality
 * 
 * This hook serves as a bridge between components and the authentication context,
 * providing easy access to user authentication state, login/logout methods, and 
 * error handling. It ensures components have proper access to auth features while
 * maintaining a clean separation of concerns.
 * 
 * @returns Authentication context data including user info, loading state, authentication functions, and error handling
 * @throws Error if used outside of AuthProvider
 */
const useAuth = (): AuthContextData => {
  // Access the AuthContext using React's useContext hook
  const auth = useContext(AuthContext);
  
  // Throw error if hook is used outside of AuthProvider
  if (auth === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Return the auth context data with user info, authentication state, and functions
  return auth;
};

export default useAuth;