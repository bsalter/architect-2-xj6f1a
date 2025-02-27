import React, { ReactNode, ReactElement } from 'react'; // react v18.2.0
import { render, RenderOptions, RenderResult, screen, waitFor } from '@testing-library/react'; // @testing-library/react v14.0.0
import { MemoryRouter } from 'react-router-dom'; // react-router-dom v6.14.2

// Import application providers
import { AuthProvider } from '../../src/context/AuthContext';
import { SiteProvider } from '../../src/context/SiteContext';
import { NotificationProvider } from '../../src/context/NotificationContext';

/**
 * Wrapper component that provides all necessary context providers for testing
 */
const AllTheProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <SiteProvider>
          <MemoryRouter>
            {children}
          </MemoryRouter>
        </SiteProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

/**
 * Renders a React component with all necessary application providers for testing
 * 
 * @param ui - The React component to render
 * @param options - Additional render options
 * @returns The render result with all testing library utilities
 */
const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Export the customRender function as the default export
export default customRender;

// Also export named utilities for easy access
export { customRender as render, screen, waitFor, AllTheProviders };