import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'; // react v18.2.0
import { login, logout, getCurrentUser } from '../api/auth';
import { User, AuthContextData, LoginCredentials } from '../types/auth';
import { getStoredToken, setStoredToken, removeStoredToken } from '../utils/storage';
import useNotification from '../hooks/useNotification';

/**
 * Creates the authentication context
 * @returns Authentication context object
 */
const createAuthContext = (): React.Context<AuthContextData | null> => {
  return createContext<AuthContextData | null>(null);
};

// Create the auth context instance
const AuthContext = createAuthContext();

/**
 * Custom hook to access the authentication context
 * @returns Authentication context data including user, loading state, error, and auth functions
 * @throws Error if used outside of AuthProvider
 */
function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Provider component that wraps the application to provide authentication context
 * Manages authentication state and implements the callback registry pattern
 * for components that need to respond to logout events
 * 
 * @param props - Component props
 * @param props.children - Child components to render within the provider
 * @returns Provider component with context value
 */
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state for user, loading, and error
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create notification hook for displaying authentication messages
  const notification = useNotification();
  
  // Create useRef to store logout callback functions
  const logoutCallbacksRef = useRef<Array<() => void>>([]);

  /**
   * Registers a callback function that will be executed when the user logs out
   * Returns a function that can be used to unregister the callback
   * 
   * @param callback - Function to execute on logout
   * @returns Function to unregister the callback
   */
  const registerLogoutCallback = useCallback((callback: () => void) => {
    logoutCallbacksRef.current.push(callback);
    // Return function to unregister
    return () => {
      logoutCallbacksRef.current = logoutCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  /**
   * Unregisters a previously registered logout callback
   * 
   * @param callback - Function to remove from the registry
   */
  const unregisterLogoutCallback = useCallback((callback: () => void) => {
    logoutCallbacksRef.current = logoutCallbacksRef.current.filter(cb => cb !== callback);
  }, []);

  /**
   * Clears any authentication errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Authenticates a user with the provided credentials
   * 
   * @param credentials - User login credentials (username/password)
   * @param rememberMe - Whether to persist authentication across browser sessions
   */
  const handleLogin = useCallback(async (credentials: LoginCredentials, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call login API
      const authData = await login(credentials, rememberMe);
      
      // Set user in state
      setUser(authData.user);
      
      notification.showSuccess('Login successful');
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Authentication failed. Please try again.';
      setError(errorMessage);
      notification.showError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notification]);

  /**
   * Logs out the current user and notifies all registered callbacks
   */
  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call logout API
      await logout();
      
      // Clear user from state
      setUser(null);
      
      // Execute all registered logout callbacks
      logoutCallbacksRef.current.forEach(callback => {
        try {
          callback();
        } catch (e) {
          console.error('Error in logout callback:', e);
        }
      });
      
      notification.showSuccess('Logout successful');
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Logout failed. Please try again.';
      notification.showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [notification]);

  /**
   * Checks if the user is already authenticated by verifying the stored token
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if there's a stored token
      const token = getStoredToken();
      
      if (!token) {
        setUser(null);
        return;
      }
      
      // Fetch current user with the token
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      // If error, clear the token and user
      removeStoredToken();
      setUser(null);
      
      if (err.error?.code === 'AUTHENTICATION_ERROR') {
        notification.showError('Your session has expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [notification]);

  // Check authentication status on component mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Create context value object with state and functions
  const contextValue: AuthContextData = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    clearError,
    registerLogoutCallback,
    unregisterLogoutCallback
  };

  // Return AuthContext.Provider with value and children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider, useAuth };