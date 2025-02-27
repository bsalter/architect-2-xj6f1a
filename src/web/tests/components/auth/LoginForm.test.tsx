import React from 'react'; // react v18.2.0
import { render, screen, waitFor } from '../../utils/render';
import userEvent from '@testing-library/user-event'; // v14.4.3
import { rest } from 'msw'; // v1.2.1
import LoginForm from '../../../src/components/auth/LoginForm';
import { server } from '../../mocks/server';
import { mockLoginResponse } from '../../mocks/data';

describe('LoginForm', () => {
  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  it('should render login form with all fields', async () => {
    render(<LoginForm onSuccess={() => {}} />);
    
    // Check for username field
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    
    // Check for password field
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Check for login button
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    
    // Check for forgot password link
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('should validate form fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={() => {}} />);
    
    // Submit the form without filling in any fields
    await user.click(screen.getByRole('button', { name: /log in/i }));
    
    // Check for validation error messages
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('should call onSuccess callback after successful login', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    
    render(<LoginForm onSuccess={onSuccess} />);
    
    // Fill in credentials
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'password');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /log in/i }));
    
    // Wait for the login to complete and verify onSuccess was called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
    
    // Make sure no error messages are displayed
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should display error message on authentication failure', async () => {
    // Override the default handler to return an error
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
    
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    
    render(<LoginForm onSuccess={onSuccess} />);
    
    // Fill in credentials
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /log in/i }));
    
    // Check for error message
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    
    // Verify that onSuccess was not called
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should show loading state during authentication', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm onSuccess={() => {}} />);
    
    // Fill in credentials
    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'password');
    
    // Get the button before clicking
    const loginButton = screen.getByRole('button', { name: /log in/i });
    
    // Submit the form
    await user.click(loginButton);
    
    // Check that button shows loading state
    expect(loginButton).toHaveAttribute('aria-busy', 'true');
    expect(loginButton).toBeDisabled();
    
    // Wait for auth to complete to avoid test errors
    await waitFor(() => {
      expect(loginButton).not.toHaveAttribute('aria-busy', 'true');
    });
  });
});