import React from 'react'; // react v18.2.0
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // react-router-dom v6.14.2

// Internal route components
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

// Page components
import Login from '../pages/Login';
import FinderPage from '../pages/FinderPage';
import InteractionCreate from '../pages/InteractionCreate';
import InteractionEdit from '../pages/InteractionEdit';
import SiteSelection from '../pages/SiteSelection';
import UserProfile from '../pages/UserProfile';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import PageNotFound from '../pages/PageNotFound';
import ErrorPage from '../pages/ErrorPage';

// Layout components
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Constants
import { ROUTES } from '../utils/constants';

/**
 * Main routing component that defines the application route structure
 *
 * @returns {JSX.Element} The router configuration with all defined routes
 */
const AppRoutes: React.FC = () => {
  // Get current location for dynamic route configuration
  const location = useLocation();

  return (
    // Define a Routes component as the root container for all routes
    <Routes location={location} key={location.pathname}>
      {/* Define a route for the application root path that redirects to the login page */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Configure public routes using PublicRoute component (login, forgot password, reset password) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Configure protected routes using PrivateRoute component */}
      <Route element={<PrivateRoute />}>
        {/* Set up nested routes under protected routes with MainLayout */}
        <Route element={<MainLayout />}>
          {/* Map URLs to the corresponding page components */}
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/interactions/new" element={<InteractionCreate />} />
          <Route path="/interactions/:id/edit" element={<InteractionEdit />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
        <Route path="/sites/select" element={<SiteSelection />} />
      </Route>

      {/* Include catch-all route for invalid URLs (PageNotFound) */}
      <Route path="*" element={<PageNotFound />} />

      {/* Include error boundary route for application errors */}
      <Route path="/error" element={<ErrorPage />} />
    </Routes>
  );
};

export default AppRoutes;