import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'; // react@18.2.0
import classNames from 'classnames'; // classnames@^2.3.2

// Define the tabs context type
interface TabsContextType {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

// Create the tabs context
const TabsContext = createContext<TabsContextType | undefined>(undefined);

/**
 * Props for the internal TabsProvider component
 */
interface TabsProviderProps {
  children: React.ReactNode;
  value: TabsContextType;
}

/**
 * Provider component that manages tab state and provides context to child components
 */
function TabsProvider({ children, value }: TabsProviderProps) {
  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
}

/**
 * Custom hook to access the tabs context
 * @returns The tabs context with activeIndex and setActiveIndex
 */
function useTabsContext(): TabsContextType {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

/**
 * Props for the Tabs component
 */
interface TabsProps {
  /**
   * The content of the tabs component (should include TabList and TabPanels)
   */
  children: React.ReactNode;
  /**
   * The index of the tab to be initially active
   * @default 0
   */
  defaultIndex?: number;
  /**
   * Callback function called when active tab changes
   */
  onChange?: (index: number) => void;
  /**
   * Additional CSS class to apply to the tabs container
   */
  className?: string;
  /**
   * Visual style variant for the tabs
   * @default 'default'
   */
  variant?: 'default' | 'underline' | 'enclosed' | 'soft-rounded';
}

/**
 * Main tabs container component that renders tab list and panels
 */
function Tabs({
  children,
  defaultIndex = 0,
  onChange,
  className,
  variant = 'default',
}: TabsProps) {
  // State to track the active tab index
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  // Update active index if defaultIndex changes
  useEffect(() => {
    setActiveIndex(defaultIndex);
  }, [defaultIndex]);

  // Handle tab change with callback
  const handleTabChange = useCallback((index: number) => {
    setActiveIndex(index);
    if (onChange) {
      onChange(index);
    }
  }, [onChange]);

  // Construct className for the tabs container
  const tabsClassName = classNames(
    'tabs',
    {
      [`tabs-${variant}`]: variant !== 'default',
    },
    className
  );

  // Create context value with active index and change handler
  const contextValue: TabsContextType = {
    activeIndex,
    setActiveIndex: handleTabChange,
  };

  return (
    <div className={tabsClassName} data-testid="tabs">
      <TabsProvider value={contextValue}>
        {children}
      </TabsProvider>
    </div>
  );
}

/**
 * Props for the TabList component
 */
interface TabListProps {
  /**
   * The tab buttons to be rendered (should be Tab components)
   */
  children: React.ReactNode;
  /**
   * Additional CSS class to apply to the tab list
   */
  className?: string;
}

/**
 * Container for tab buttons that users click to change tabs
 */
function TabList({ children, className }: TabListProps) {
  const tabListClassName = classNames('tabs-list', className);

  return (
    <div className={tabListClassName} role="tablist">
      {children}
    </div>
  );
}

/**
 * Props for the Tab component
 */
interface TabProps {
  /**
   * The index of this tab
   */
  index: number;
  /**
   * The content of the tab
   */
  children: React.ReactNode;
  /**
   * Whether the tab is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS class to apply to the tab
   */
  className?: string;
}

/**
 * Individual tab button that users click to select a tab
 */
function Tab({ index, children, disabled = false, className }: TabProps) {
  const { activeIndex, setActiveIndex } = useTabsContext();
  const isSelected = activeIndex === index;

  // Click handler
  const handleClick = () => {
    if (!disabled) {
      setActiveIndex(index);
    }
  };

  // Keyboard handler for activation and navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Handle key presses
    switch (e.key) {
      case 'Enter':
      case ' ':
        // Activate tab on Enter or Space
        e.preventDefault();
        setActiveIndex(index);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'Home':
      case 'End':
        // Find all tab elements
        const tablistNode = e.currentTarget.parentElement;
        if (!tablistNode) return;
        
        const tabs = Array.from(
          tablistNode.querySelectorAll('[role="tab"]:not([aria-disabled="true"])')
        );
        const currentIndex = tabs.indexOf(e.currentTarget);
        
        // Determine which tab to focus based on key
        let nextIndex;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'Home') {
          e.preventDefault();
          nextIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          nextIndex = tabs.length - 1;
        } else {
          return;
        }
        
        // Focus the next tab
        (tabs[nextIndex] as HTMLElement).focus();
        break;
      default:
        break;
    }
  };

  // Construct className for the tab
  const tabClassName = classNames(
    'tab',
    {
      'tab-active': isSelected,
      'tab-disabled': disabled,
    },
    className
  );

  return (
    <button
      className={tabClassName}
      role="tab"
      aria-selected={isSelected}
      aria-disabled={disabled}
      aria-controls={`tabpanel-${index}`}
      id={`tab-${index}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`tab-${index}`}
      type="button"
    >
      {children}
    </button>
  );
}

/**
 * Props for the TabPanels component
 */
interface TabPanelsProps {
  /**
   * The tab panels to be rendered (should be TabPanel components)
   */
  children: React.ReactNode;
  /**
   * Additional CSS class to apply to the tab panels container
   */
  className?: string;
}

/**
 * Container for tab panel content sections
 */
function TabPanels({ children, className }: TabPanelsProps) {
  const tabPanelsClassName = classNames('tabs-panels', className);

  return (
    <div className={tabPanelsClassName}>
      {children}
    </div>
  );
}

/**
 * Props for the TabPanel component
 */
interface TabPanelProps {
  /**
   * The index of this panel
   */
  index: number;
  /**
   * The content of the panel
   */
  children: React.ReactNode;
  /**
   * Additional CSS class to apply to the panel
   */
  className?: string;
  /**
   * Whether to lazy load the panel content (only render when active)
   * @default false
   */
  lazyLoad?: boolean;
}

/**
 * Content panel associated with a specific tab
 */
function TabPanel({ index, children, className, lazyLoad = false }: TabPanelProps) {
  const { activeIndex } = useTabsContext();
  const isSelected = activeIndex === index;

  // If using lazy loading and panel is not selected, don't render
  if (lazyLoad && !isSelected) {
    return null;
  }

  // Construct className for the panel
  const tabPanelClassName = classNames(
    'tab-panel',
    {
      'tab-panel-active': isSelected,
    },
    className
  );

  return (
    <div
      className={tabPanelClassName}
      role="tabpanel"
      aria-labelledby={`tab-${index}`}
      id={`tabpanel-${index}`}
      hidden={!isSelected}
      tabIndex={0}
      data-testid={`tabpanel-${index}`}
    >
      {children}
    </div>
  );
}

// Export all components and types
export {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useTabsContext,
  TabsProps,
  TabListProps,
  TabProps,
  TabPanelsProps,
  TabPanelProps,
};