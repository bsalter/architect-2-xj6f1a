import { useContext } from 'react'; // react v18.2.0
import { NotificationContext, NotificationType } from '../context/NotificationContext';

/**
 * Interface for notification options
 */
export interface NotificationOptions {
  /**
   * Whether the notification should stay visible until manually dismissed
   * @default false
   */
  autoDismiss?: boolean;
  
  /**
   * Duration in milliseconds before auto-dismissing notification
   * @default 5000
   */
  duration?: number;
}

/**
 * Custom hook that provides access to the notification system,
 * offering methods to show different types of notifications
 * 
 * @returns Object containing methods to show and clear notifications
 */
export const useNotification = () => {
  // Get notification context
  const { addNotification, removeNotification, clearNotifications } = useContext(NotificationContext);

  /**
   * Shows a notification with the specified type, message, and options
   * 
   * @param type - The type of notification: success, error, warning, or info
   * @param message - The message to display in the notification
   * @param options - Additional options for the notification behavior
   */
  const showNotification = (
    type: NotificationType,
    message: string,
    options?: NotificationOptions
  ) => {
    addNotification({
      type,
      message,
      duration: options?.duration,
      persistent: options?.autoDismiss === false // If autoDismiss is false, notification is persistent
    });
  };

  /**
   * Shows a success notification
   * 
   * @param message - The success message to display
   * @param options - Additional options for the notification behavior
   */
  const showSuccess = (message: string, options?: NotificationOptions) => {
    showNotification('success', message, options);
  };

  /**
   * Shows an error notification
   * 
   * @param message - The error message to display
   * @param options - Additional options for the notification behavior
   */
  const showError = (message: string, options?: NotificationOptions) => {
    showNotification('error', message, options);
  };

  /**
   * Shows a warning notification
   * 
   * @param message - The warning message to display
   * @param options - Additional options for the notification behavior
   */
  const showWarning = (message: string, options?: NotificationOptions) => {
    showNotification('warning', message, options);
  };

  /**
   * Shows an info notification
   * 
   * @param message - The informational message to display
   * @param options - Additional options for the notification behavior
   */
  const showInfo = (message: string, options?: NotificationOptions) => {
    showNotification('info', message, options);
  };

  /**
   * Removes all active notifications
   */
  const clearAllNotifications = () => {
    clearNotifications();
  };

  // Return the notification methods
  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotifications: clearAllNotifications,
    removeNotification
  };
};

export default useNotification;