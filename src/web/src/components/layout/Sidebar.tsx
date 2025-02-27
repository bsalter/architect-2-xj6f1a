import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom'; // react-router-dom v6.14.2
import { FaSearch, FaPlus, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // react-icons/fa v4.10.1
import useAuth from '../../hooks/useAuth';
import useSite from '../../hooks/useSite';
import Button from '../ui/Button';

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

interface NavItem {
  path: string;
  title: string;
  icon: React.ReactNode;
  requireSite?: boolean;
}

/**
 * Navigation sidebar component that provides the main application navigation menu
 * with links to different sections of the application. It adapts to the user's
 * site context and displays appropriate navigation options.
 */
const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapse }) => {
  const { user } = useAuth();
  const { currentSite } = useSite();
  const location = useLocation();
  
  // Define navigation items with paths, titles, icons, and site requirements
  const navItems: NavItem[] = [
    {
      path: '/finder',
      title: 'Finder',
      icon: <FaSearch />,
      requireSite: true
    },
    {
      path: '/interaction/new',
      title: 'New Interaction',
      icon: <FaPlus />,
      requireSite: true
    },
    {
      path: '/profile',
      title: 'Profile',
      icon: <FaUser />,
      requireSite: false
    }
  ];
  
  /**
   * Helper function to render a navigation item
   * @param item - The navigation item to render
   * @param collapsed - Whether the sidebar is collapsed
   * @param currentPath - The current path from the router
   * @returns The rendered navigation item
   */
  const renderNavItem = (item: NavItem, collapsed: boolean, currentPath: string): JSX.Element => {
    const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
    
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) => 
          `flex items-center rounded-md px-3 py-2 my-1 transition-colors duration-200 ${
            isActive 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`
        }
        title={collapsed ? item.title : undefined}
      >
        <span className={`text-lg ${collapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
        {!collapsed && <span className="ml-3">{item.title}</span>}
      </NavLink>
    );
  };
  
  return (
    <div 
      className={`fixed top-0 left-0 bottom-0 bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-10 
        ${collapsed ? 'w-16' : 'w-64'} 
        lg:relative 
        ${collapsed ? 'hidden sm:block' : 'block'}`}
    >
      {/* Collapse toggle button */}
      <div className="flex justify-end p-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </Button>
      </div>
      
      {/* Application branding */}
      <div className="px-4 py-4 border-b border-gray-200">
        {collapsed ? (
          <div className="text-2xl font-bold text-center text-blue-600">IM</div>
        ) : (
          <div className="text-xl font-bold text-blue-600">Interaction Management</div>
        )}
      </div>
      
      {/* Navigation links */}
      <nav className="px-2 py-4">
        {navItems
          .filter(item => !item.requireSite || currentSite)
          .map((item) => (
            <React.Fragment key={item.path}>
              {renderNavItem(item, collapsed, location.pathname)}
            </React.Fragment>
          ))
        }
      </nav>
      
      {/* Site context indicator */}
      {currentSite && !collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 text-sm text-gray-500 border-t border-gray-200">
          <span className="block font-medium">Current Site:</span>
          <span className="block truncate">{currentSite.name}</span>
        </div>
      )}
    </div>
  );
};

export default Sidebar;