import React from "react";
import { useNotification } from "../hooks/useNotification";
import "../assets/css/toast.css";

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotification();

  // If no notifications, don't render the container
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="toast-container position-fixed top-0 end-0 p-3">
      {notifications.map((notification) => (
        <div key={notification.id} className={`toast show fade bs-toast align-items-center border-0 bg-${notification.type}`} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="d-flex">
            <div className="toast-body text-white">
              <i className={`me-2 ri-${getIconForType(notification.type)}`}></i>
              {notification.message}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => removeNotification(notification.id)} aria-label="Close"></button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to get the right icon for each notification type
function getIconForType(type) {
  switch (type) {
    case "success":
      return "check-line";
    case "danger":
      return "error-warning-line";
    case "warning":
      return "alert-line";
    case "info":
    default:
      return "information-line";
  }
}

export default ToastContainer;
