"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { NotificationItem } from "./NotificationItem";

export function NotificationPanel() {
  const { 
    notifications, 
    isNotificationPanelOpen, 
    setIsNotificationPanelOpen,
    markAllAsRead
  } = useNotifications();
  
  const panelRef = useRef(null);
  
  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsNotificationPanelOpen(false);
      }
    };
    
    if (isNotificationPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationPanelOpen, setIsNotificationPanelOpen]);
  
  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    const dateStr = format(date, "MMM d, yyyy");
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    
    groups[dateStr].push(notification);
    return groups;
  }, {});
  
  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-800",
        isNotificationPanelOpen ? "translate-x-0" : "translate-x-full"
      )}
      ref={panelRef}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs flex items-center"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all as read
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationPanelOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3">
                <div className="text-2xl">🔔</div>
              </div>
              <p>No notifications yet</p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([date, items]) => (
              <div key={date} className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {date}
                </h3>
                <div className="space-y-2">
                  {items.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 