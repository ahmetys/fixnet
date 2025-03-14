import React, { createContext, useState, useContext, useCallback } from "react";

// Create context
const NotificationContext = createContext();

// Types of notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "danger",
  WARNING: "warning",
  INFO: "info",
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, timeout = 3000) => {
    const id = Date.now();

    // Add notification to the list
    setNotifications((prevNotifications) => [...prevNotifications, { id, message, type }]);

    // Remove notification after timeout
    if (timeout) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  }, []);

  // Remove a notification by id
  const removeNotification = useCallback((id) => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id));
  }, []);

  // Helper methods for specific notification types
  const showSuccess = useCallback(
    (message, timeout) => {
      return addNotification(message, NOTIFICATION_TYPES.SUCCESS, timeout);
    },
    [addNotification]
  );

  const showError = useCallback(
    (message, timeout) => {
      return addNotification(message, NOTIFICATION_TYPES.ERROR, timeout);
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, timeout) => {
      return addNotification(message, NOTIFICATION_TYPES.WARNING, timeout);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, timeout) => {
      return addNotification(message, NOTIFICATION_TYPES.INFO, timeout);
    },
    [addNotification]
  );

  // API error handler
  const handleApiError = useCallback(
    (error) => {
      const errorMessage = error.response?.data?.message || error.message || "An error occurred";
      showError(errorMessage);
    },
    [showError]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        handleApiError,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
