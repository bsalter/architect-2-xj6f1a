import React, { useEffect } from 'react'; // react v18.2.0
import { AnimatePresence, motion } from 'framer-motion'; // framer-motion v10.12.16
import { useNotification } from '../../hooks/useNotification';
import Alert from '../ui/Alert';
import { Notification } from '../../context/NotificationContext';

/**
 * Component that renders a stack of notification alerts with animations
 * 
 * @returns {JSX.Element} The rendered notification component
 */
const Notifications = () => {
  // Retrieve notifications array and removeNotification function using the useNotification hook
  const { notifications, removeNotification } = useNotification();
  
  /**
   * Handles dismissing a notification by its ID
   * 
   * @param {string} id - The ID of the notification to dismiss
   */
  const handleDismiss = (id: string): void => {
    // Call removeNotification function from useNotification hook with the notification ID
    // This removes the notification from the context state
    removeNotification(id);
  };
  
  return (
    // Render a fixed position container for notifications
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
      {/* Use AnimatePresence to handle animation of notifications entering and exiting */}
      <AnimatePresence>
        {/* Map through notifications to render each as an Alert component */}
        {notifications.map((notification: Notification) => (
          // Apply motion animations for slide-in and fade-out effects
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
          >
            {/* Set variant of Alert based on notification type (success, error, warning, info) */}
            <Alert
              variant={notification.type}
              dismissible
              // Make alerts dismissible with onDismiss function that removes the notification
              onDismiss={() => handleDismiss(notification.id)}
            >
              {notification.message}
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;