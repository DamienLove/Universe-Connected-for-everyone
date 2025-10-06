import React from 'react';

interface NotificationProps {
  message: string;
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000); // Notification disappears after 3 seconds
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="notification-toast bg-gray-800 bg-opacity-80 border border-teal-500 text-white p-4 rounded-lg shadow-lg glow-text max-w-sm">
      <p>{message}</p>
    </div>
  );
};

export default Notification;