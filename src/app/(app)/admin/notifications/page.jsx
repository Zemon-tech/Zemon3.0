"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationComposer } from "./components/NotificationComposer";
import { NotificationsList } from "./components/NotificationsList";
import { NotificationPreview } from "./components/NotificationPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("compose");
  const [error, setError] = useState(null);
  const [previewNotification, setPreviewNotification] = useState(null);
  
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check admin status
        if (!isAdmin) {
          setError("You do not have permission to access this page");
          setIsLoading(false);
          return;
        }
        
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, role');
          
        if (usersError) throw usersError;
        setUsers(usersData || []);
        
        // Fetch sent notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (notificationsError) throw notificationsError;
        setNotifications(notificationsData || []);
        
      } catch (error) {
        console.error('Error loading admin data:', error.message);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, isAdmin]);
  
  const handleSendNotification = async (notificationData) => {
    try {
      setError(null);
      
      // Handle different recipient types
      const recipients = [];
      
      if (notificationData.recipientType === 'all') {
        // Send to all users
        recipients.push(...users.map(u => u.id));
      } else if (notificationData.recipientType === 'team') {
        // Send to team members
        recipients.push(...users.filter(u => 
          u.role === notificationData.team
        ).map(u => u.id));
      } else if (notificationData.recipientType === 'individual') {
        // Send to specific user
        recipients.push(notificationData.userId);
      }
      
      if (recipients.length === 0) {
        setError("No recipients selected");
        return false;
      }

      // Prepare base notification object WITHOUT created_by
      const baseNotification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        link: notificationData.link,
        severity: notificationData.severity,
        read: false,
        created_at: new Date()
      };
      
      // Create notifications for each recipient
      const { data, error } = await supabase
        .from('notifications')
        .insert(
          recipients.map(userId => ({
            ...baseNotification,
            user_id: userId
          }))
        );
      
      if (error) throw error;
      
      // Refresh notifications list
      const { data: updatedNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (fetchError) throw fetchError;
      setNotifications(updatedNotifications || []);
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error.message);
      setError("Failed to send notification: " + error.message);
      return false;
    }
  };
  
  const handlePreview = (notificationData) => {
    // Generate preview notification
    setPreviewNotification({
      ...notificationData,
      id: 'preview',
      created_at: new Date(),
      read: false
    });
    
    setActiveTab("preview");
  };
  
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }
  
  if (error && error.includes("permission")) {
    return (
      <div className="p-8">
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="pt-6 flex items-center">
            <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Create and send notifications to users
          </p>
        </div>
      </div>
      
      {error && (
        <Card className="mb-6 border-red-300 dark:border-red-800">
          <CardContent className="pt-6 flex items-center">
            <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Create Notification</CardTitle>
              <CardDescription>
                Compose a new notification to send to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationComposer 
                users={users} 
                onSend={handleSendNotification}
                onPreview={handlePreview}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View sent notifications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationsList notifications={notifications} users={users} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preview</CardTitle>
              <CardDescription>
                See how your notification will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewNotification ? (
                <NotificationPreview notification={previewNotification} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No notification to preview. Create one from the Compose tab.
                </p>
              )}
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setActiveTab("compose")} className="mr-2">
                  Back to Compose
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 