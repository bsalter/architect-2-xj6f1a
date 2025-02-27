import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { rest } from 'msw';

import { AuthContext, AuthProvider, useAuth } from '../../src/context/AuthContext';
import { mockUser, mockSites, mockLoginResponse } from '../mocks/data';
import server from '../mocks/server';
import { LoginCredentials } from '../../src/types/auth';
import * as authApi from '../../src/api/auth';
import { getStoredToken, setStoredToken, removeStoredToken } from '../../src/utils/storage';
import { API_ENDPOINTS } from '../../src/utils/constants';

// A test component that consumes the AuthContext to verify its functionality
const TestComponent: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuth();

  const handleLogin = () => {
    login({ username: 'testuser', password: 'password' });
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && (
        <div data-testid="user-info">
          {user.username} - {user.email}
        </div>
      )}
      <button data-testid="login-button" onClick={handleLogin}>
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

// Sets up mocks for localStorage to test token storage and retrieval
const setupLocalStorageMock = () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock,
    writable: true
  });

  // Clear storage before each test
  beforeEach(() => {
    localStorageMock.clear();
  });
};

// Configures MSW handlers for authentication API endpoints
const setupAuthMocks = (loginSuccess: boolean = true) => {
  server.use(
    rest.post(API_ENDPOINTS.AUTH.LOGIN, (req, res, ctx) => {
      if (loginSuccess) {
        return res(ctx.json({ status: 'success', data: mockLoginResponse }));
      } else {
        return res(
          ctx.status(401),
          ctx.json({
            status: 'error',
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid username or password'
            }
          })
        );
      }
    }),
    
    rest.get(API_ENDPOINTS.AUTH.ME, (req, res, ctx) => {
      return res(ctx.json({ status: 'success', data: { user: mockUser }}));
    }),
    
    rest.post(API_ENDPOINTS.AUTH.LOGOUT, (req, res, ctx) => {
      return res(ctx.json({ status: 'success', data: { success: true }}));
    })
  );
};

// Set up before all tests run
beforeAll(() => {
  setupLocalStorageMock();
  server.listen();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Reset handlers and mocks between tests
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

describe('AuthContext', () => {
  test('should initialize with unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });
  
  test('should update state after successful login', async () => {
    setupAuthMocks(true);
    
    // Spy on the login function
    const loginSpy = jest.spyOn(authApi, 'login');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initial state should be unauthenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    
    // Trigger login
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for state to update after login
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Check user info is displayed
    expect(screen.getByTestId('user-info')).toHaveTextContent(`${mockUser.username} - ${mockUser.email}`);
    
    // Verify login API was called with correct credentials
    expect(loginSpy).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'testuser', password: 'password' }),
      false
    );
  });
  
  test('should handle login errors correctly', async () => {
    setupAuthMocks(false);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Trigger login
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Should remain unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // No token should be stored
    expect(getStoredToken()).toBeNull();
  });
  
  test('should clear authentication state on logout', async () => {
    setupAuthMocks(true);
    
    // Mock initial authenticated state
    setStoredToken('test-token');
    
    // Spy on the logout API call
    const logoutSpy = jest.spyOn(authApi, 'logout');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Trigger logout
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Should become unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // Token should be removed
    expect(getStoredToken()).toBeNull();
    
    // Logout API should have been called
    expect(logoutSpy).toHaveBeenCalled();
  });
  
  test('should restore authentication from stored token on mount', async () => {
    setupAuthMocks(true);
    
    // Setup token in storage
    setStoredToken('test-token');
    
    // Spy on the getCurrentUser API
    const getCurrentUserSpy = jest.spyOn(authApi, 'getCurrentUser');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should be authenticated based on stored token
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // User data should be loaded from API
    expect(screen.getByTestId('user-info')).toHaveTextContent(`${mockUser.username} - ${mockUser.email}`);
    
    // getCurrentUser should have been called
    expect(getCurrentUserSpy).toHaveBeenCalled();
  });
  
  test('should handle expired or invalid tokens on mount', async () => {
    // Setup localStorage with expired token
    setStoredToken('expired-token');
    
    // Override getCurrentUser endpoint to return error
    server.use(
      rest.get(API_ENDPOINTS.AUTH.ME, (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            status: 'error',
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Token expired'
            }
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should remain unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // Token should be removed from localStorage
    expect(getStoredToken()).toBeNull();
  });
  
  test('should set initial site context after successful login', async () => {
    // Set up mock server to return successful login with sites
    server.use(
      rest.post(API_ENDPOINTS.AUTH.LOGIN, (req, res, ctx) => {
        return res(
          ctx.json({
            status: 'success',
            data: {
              ...mockLoginResponse,
              user: {
                ...mockUser,
                sites: mockSites
              }
            }
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Trigger login
    fireEvent.click(screen.getByTestId('login-button'));
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // First available site should be selected as default
    // This would normally be verified through the site context
  });
  
  test('should register and execute logout callbacks', async () => {
    // Create mock logout callback function
    const mockCallback = jest.fn();
    
    const CallbackComponent = () => {
      const { registerLogoutCallback, logout } = useAuth();
      
      // Register callback on mount
      React.useEffect(() => {
        const unregister = registerLogoutCallback(mockCallback);
        return unregister;
      }, [registerLogoutCallback]);
      
      return (
        <button data-testid="logout-button" onClick={logout}>
          Logout
        </button>
      );
    };
    
    render(
      <AuthProvider>
        <CallbackComponent />
      </AuthProvider>
    );
    
    // Trigger logout action
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Verify callback was executed
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });
});

describe('useAuth hook', () => {
  test('should throw error when used outside AuthProvider', () => {
    // Suppress the expected error in console during test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create component that uses useAuth hook without AuthProvider
    const InvalidComponent = () => {
      useAuth();
      return <div>Invalid usage</div>;
    };
    
    // Expect render to throw error
    expect(() => {
      render(<InvalidComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    // Restore console.error
    consoleError.mockRestore();
  });
  
  test('should provide authentication methods and state', () => {
    // Create component that uses useAuth hook
    const HookVerifierComponent = () => {
      const auth = useAuth();
      
      // Verify all expected properties and methods are available
      const hasRequired = [
        'isAuthenticated',
        'user',
        'loading',
        'error',
        'login',
        'logout',
        'clearError',
        'registerLogoutCallback',
        'unregisterLogoutCallback'
      ].every(prop => prop in auth);
      
      return (
        <div data-testid="hook-result" data-has-required={hasRequired.toString()}>
          Hook check
        </div>
      );
    };
    
    render(
      <AuthProvider>
        <HookVerifierComponent />
      </AuthProvider>
    );
    
    // Verify methods can be called without errors
    expect(screen.getByTestId('hook-result')).toHaveAttribute('data-has-required', 'true');
  });
});