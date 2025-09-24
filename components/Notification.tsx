import React from 'react';

interface NotificationProps {
  message: string;
  onDismiss: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // Notification disappears after 5 seconds
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-5 right-5 bg-gray-800 bg-opacity-80 border border-teal-500 text-white p-4 rounded-lg shadow-lg animate-pulse glow-text max-w-sm z-[110]">
      <p>{message}</p>
    </div>
  );
};

export default Notification;