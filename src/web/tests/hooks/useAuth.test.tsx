import React from 'react';
import { render, screen, waitFor, AllTheProviders } from '../utils/render';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import useAuth from '../../src/hooks/useAuth';
import { server } from '../mocks/server';
import { mockUsers, mockLoginResponse } from '../mocks/data';
import { handlers } from '../mocks/handlers';

// Test component that uses the useAuth hook for testing
const TestComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    error, 
    login, 
    logout, 
    clearError 
  } = useAuth();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch (err) {
      // Error handling is done in the hook
    }
  };

  if (loading) {
    return <div data-testid="loading-indicator">Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <div data-testid="error-message">{error}</div>
        <button onClick={clearError} data-testid="clear-error-button">
          Clear Error
        </button>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div>
        <div data-testid="user-name">{user.username}</div>
        <div data-testid="user-email">{user.email}</div>
        <button onClick={logout} data-testid="logout-button">
          Logout
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} data-testid="login-form">
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        data-testid="username-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit" data-testid="login-button">
        Login
      </button>
    </form>
  );
};

// Setup function for rendering the test component
const setup = () => {
  return render(<TestComponent />, { wrapper: AllTheProviders });
};

describe('useAuth hook', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('should have initial state with loading true and user null', async () => {
    setup();
    
    // Initially it should show loading
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // After initial load completes, login form should appear (user is null)
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  it('should login successfully', async () => {
    setup();
    
    // Wait for login form to appear
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
    
    // Fill in login form
    await act(async () => {
      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      
      // Use fireEvent to update input values
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      
      // Submit form
      fireEvent.submit(screen.getByTestId('login-form'));
    });
    
    // Wait for user data to display after successful login
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('admin');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
    });
  });

  it('should handle login failure', async () => {
    // Override the login handler for this test
    server.use(
      rest.post('*/auth/login', (req, res, ctx) => {
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
      })
    );

    setup();
    
    // Wait for login form to appear
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
    
    // Fill in login form with invalid credentials
    await act(async () => {
      const usernameInput = screen.getByTestId('username-input');
      const passwordInput = screen.getByTestId('password-input');
      
      fireEvent.change(usernameInput, { target: { value: 'wrong' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      
      fireEvent.submit(screen.getByTestId('login-form'));
    });
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('should logout successfully', async () => {
    setup();
    
    // Login first
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'admin' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password' } });
      fireEvent.submit(screen.getByTestId('login-form'));
    });
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });
    
    // Click logout button
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-button'));
    });
    
    // Verify user is logged out (login form is shown again)
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  it('should clear error when requested', async () => {
    // Override handler to return login error
    server.use(
      rest.post('*/auth/login', (req, res, ctx) => {
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
      })
    );

    setup();
    
    // Login with invalid credentials to trigger error
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'wrong' } });
      fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong' } });
      fireEvent.submit(screen.getByTestId('login-form'));
    });
    
    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Clear the error
    await act(async () => {
      fireEvent.click(screen.getByTestId('clear-error-button'));
    });
    
    // Verify error is cleared and login form is shown
    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  it('should retrieve current user on mount', async () => {
    // Override handler to return current user data
    server.use(
      rest.get('*/auth/me', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              user: mockUsers[0]
            }
          })
        );
      })
    );

    setup();
    
    // Wait for initial authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('admin');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
    });
  });
});

// Mock fireEvent for testing inputs
const fireEvent = {
  change(element, { target }) {
    const event = new Event('input', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });
    element.dispatchEvent(event);
    // Also update the value directly for controlled components
    element.value = target.value;
  },
  click(element) {
    element.click();
  },
  submit(element) {
    const event = new Event('submit', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  }
};