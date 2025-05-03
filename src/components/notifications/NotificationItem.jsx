"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function NotificationItem({ notification }) {
  const { markAsRead } = useNotifications();
  
  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };
  
  const handleItemClick = (e) => {
    // Don't navigate if clicking on checkmark
    if (e.target.closest('button')) {
      e.preventDefault();
      return;
    }
    
    handleClick();
  };
  
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'message':
        return '💬';
      case 'resource':
        return '📄';
      case 'task':
        return '✅';
      case 'event':
        return '📅';
      default:
        return '🔔'; // system
    }
  };
  
  const getSeverityStyles = () => {
    switch (notification.severity) {
      case 'error':
        return 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success':
        return 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20';
      default: // info
        return 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20';
    }
  };
  
  const severityStyles = getSeverityStyles();
  const createdAt = new Date(notification.created_at);

  const content = (
    <div 
      className={cn(
        "flex items-start p-3 rounded-lg border-l-4 transition-colors",
        severityStyles,
        !notification.read ? "bg-opacity-100" : "bg-opacity-50",
        notification.read ? "opacity-70" : "opacity-100",
        "dark:shadow-md"
      )}
      onClick={handleItemClick}
    >
      <div className="mr-3 mt-0.5 text-lg">{getTypeIcon()}</div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <p className={cn(
            "text-sm font-medium leading-none",
            !notification.read && "font-semibold",
            "dark:text-white"
          )}>
            {notification.title}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={cn(
              "text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ml-2",
              notification.read && "hidden"
            )}
            aria-label="Mark as read"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-1.5">
          {notification.message}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {format(createdAt, "h:mm a")}
          </span>
          
          {notification.severity === 'error' && (
            <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
              High Priority
            </span>
          )}
        </div>
      </div>
    </div>
  );
  
  if (notification.link) {
    return (
      <Link href={notification.link} className="block cursor-pointer">
        {content}
      </Link>
    );
  }
  
  return (
    <div className="cursor-pointer">
      {content}
    </div>
  );
} 