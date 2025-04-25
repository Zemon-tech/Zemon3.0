"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const { user } = useAuth();

  // Load notifications on mount and when user changes
  useEffect(() => {
    if (!user) return;
    
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        setNotifications(data || []);
        calculateUnreadCount(data || []);
      } catch (error) {
        console.error('Error loading notifications:', error.message);
      }
    };

    loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        handleNewNotification(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const calculateUnreadCount = (notifs) => {
    const count = notifs.filter(notif => !notif.read).length;
    setUnreadCount(count);
  };

  const handleNewNotification = (notification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast(notification.title, {
      description: notification.message,
      action: {
        label: "View",
        onClick: () => {
          setIsNotificationPanelOpen(true);
          if (notification.link) {
            window.location.href = notification.link;
          }
        }
      },
      icon: getNotificationIcon(notification.type),
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
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

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      
      // Recalculate unread count
      calculateUnreadCount(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error.message);
    }
  };

  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen(prev => !prev);
  };

  const createNotification = async (notificationData) => {
    try {
      // Prepare notification data WITHOUT created_by
      const notification = {
        user_id: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        link: notificationData.link,
        severity: notificationData.severity || 'info',
        read: false,
        created_at: new Date()
      };
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select();
      
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error creating notification:', error.message);
      return null;
    }
  };

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        isNotificationPanelOpen,
        toggleNotificationPanel,
        markAsRead,
        markAllAsRead,
        createNotification,
        setIsNotificationPanelOpen
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext); 