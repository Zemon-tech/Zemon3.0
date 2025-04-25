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
      case 'chat':
        return '💬';
      case 'resource':
        return '📄';
      case 'update':
        return '🔄';
      case 'music':
        return '🎵';
      case 'victory':
        return '🏆';
      default:
        return '🔔';
    }
  };
  
  const getSeverityStyles = () => {
    switch (notification.severity) {
      case 'high':
        return 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'border-yellow-500 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20';
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
        notification.read ? "opacity-70" : "opacity-100"
      )}
      onClick={handleItemClick}
    >
      <div className="mr-3 mt-0.5 text-lg">{getTypeIcon()}</div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <p className={cn(
            "text-sm font-medium leading-none",
            !notification.read && "font-semibold"
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
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
          {notification.message}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-500">
            {format(createdAt, "h:mm a")}
          </span>
          
          {notification.severity === 'high' && (
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