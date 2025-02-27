import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom'; // react-router-dom v6.14.2

// Internal components
import { Header } from '../layout/Header';
import { Sidebar } from '../layout/Sidebar';
import { Footer } from '../layout/Footer';
import { Notifications } from '../shared/Notifications';

// Custom hooks
import useAuth from '../../hooks/useAuth';
import useSite from '../../hooks/useSite';

/**
 * Main layout component that provides the application structure with header, 
 * sidebar, content area, and footer for authenticated users.
 * 
 * This component serves as the primary layout container for the entire application,
 * implementing the UI design specified in the wireframes and ensuring consistent
 * navigation and site context across all views.
 * 
 * @returns {JSX.Element} Rendered layout component with header, sidebar, content area, and footer
 */
const MainLayout: React.FC = () => {
  // Get authentication state
  const { isAuthenticated } = useAuth();
  
  // Get current site context
  const { currentSite } = useSite();
  
  // State for sidebar collapse status
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  // Close sidebar on small screens when clicking outside or navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    // Set initial state based on screen size
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Application header with site selector and user menu */}
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          toggleCollapse={toggleSidebar} 
        />
        
        {/* Main content area */}
        <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0 sm:ml-16' : 'ml-0 sm:ml-64'}`}>
          <div className="container mx-auto px-4 py-6">
            {/* Render child routes using Outlet */}
            <Outlet />
          </div>
          
          {/* Application footer */}
          <Footer />
        </main>
      </div>
      
      {/* Notification system */}
      <Notifications />
    </div>
  );
};

export default MainLayout;