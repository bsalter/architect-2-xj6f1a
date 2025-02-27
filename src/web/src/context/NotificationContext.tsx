import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'; // react v18.2.0
import { v4 as uuidv4 } from 'uuid'; // uuid v8.3.2
import Alert from '../components/ui/Alert';

// Default duration for notifications in milliseconds
const DEFAULT_NOTIFICATION_DURATION = 5000;

// Initial context state
const NOTIFICATION_INITIAL_STATE = { notifications: [] };

// Type for the different notification variants
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Interface for notification objects
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
  persistent: boolean;
  timestamp: number;
}

// Interface for the props needed to create a notification
export interface NotificationProps {
  type: NotificationType;
  message: string;
  duration?: number;
  persistent?: boolean;
}

// Interface defining the shape of the notification context
export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (props: NotificationProps) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// Create the notification context
export const NotificationContext = createContext<NotificationContextType>({
  ...NOTIFICATION_INITIAL_STATE,
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {}
});

/**
 * NotificationProvider component that manages notifications state and provides
 * methods to add, remove, and clear notifications across the application.
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to be wrapped by the provider
 * @returns {JSX.Element} The provider component with notification context
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State to hold all active notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Add a new notification with unique ID
   */
  const addNotification = useCallback((props: NotificationProps) => {
    const { 
      type, 
      message, 
      duration = DEFAULT_NOTIFICATION_DURATION, 
      persistent = false 
    } = props;
    
    const newNotification: Notification = {
      id: uuidv4(), // Generate unique ID for the notification
      type,
      message,
      duration,
      persistent,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  /**
   * Remove a notification by its ID
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Set up auto-dismiss for non-persistent notifications
   */
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    notifications.forEach(notification => {
      if (!notification.persistent) {
        const timeout = setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
        
        timeouts.push(timeout);
      }
    });
    
    // Cleanup timeouts when component unmounts or notifications change
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [notifications, removeNotification]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      clearNotifications
    }),
    [notifications, addNotification, removeNotification, clearNotifications]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;