"use client";

import { NotificationItem } from "@/components/notifications/NotificationItem";

export function NotificationPreview({ notification }) {
  // Create a mock notification from the form data
  const mockNotification = {
    id: 'preview',
    user_id: 'preview',
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
    severity: notification.severity,
    read: false,
    created_at: new Date().toISOString()
  };
  
  return (
    <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-1">This is how your notification will appear to recipients:</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Notifications appear in the notification panel and as toast notifications.
        </p>
      </div>
      
      <div className="max-w-md mx-auto">
        <NotificationItem notification={mockNotification} />
      </div>
      
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
          Recipients
        </h4>
        <p>
          {notification.recipientType === 'all' 
            ? 'All users will receive this notification.' 
            : notification.recipientType === 'team'
              ? `Team members with the role "${notification.team}" will receive this notification.`
              : 'The selected individual user will receive this notification.'}
        </p>
      </div>
    </div>
  );
} 