"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationBadge() {
  const { unreadCount, toggleNotificationPanel } = useNotifications();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleNotificationPanel}
      className="relative"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      
      {unreadCount > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 flex items-center justify-center",
          "rounded-full bg-red-500 text-white text-xs min-w-[1.25rem] h-5 px-1",
          "animate-in fade-in duration-300"
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
} 