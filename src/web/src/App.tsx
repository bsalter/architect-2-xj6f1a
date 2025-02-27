import React from 'react'; // react v18.2.0
import { BrowserRouter } from 'react-router-dom'; // react-router-dom v6.14.2

// Internal components
import AppRoutes from './routes';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider } from './context/SiteContext';
import NotificationProvider from './context/NotificationContext';
import Notifications from './components/shared/Notifications';
import ErrorBoundary from './components/shared/ErrorBoundary';

/**
 * The root component of the application that configures providers and routing
 * @returns {JSX.Element} The rendered application with all providers and routing
 */
const App: React.FC = () => {
  return (
    // Wrap the application with ErrorBoundary for catching unhandled errors
    <ErrorBoundary>
      {/* Wrap with NotificationProvider to enable application-wide notifications */}
      <NotificationProvider>
        {/* Wrap with AuthProvider to manage authentication state */}
        <AuthProvider>
          {/* Wrap with SiteProvider to manage site context (dependent on AuthProvider) */}
          <SiteProvider>
            {/* Wrap with BrowserRouter to enable client-side routing */}
            <BrowserRouter>
              {/* Include the Notifications component to display notification messages */}
              <Notifications />
              {/* Render the AppRoutes component which contains all application routes */}
              <AppRoutes />
            </BrowserRouter>
          </SiteProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;