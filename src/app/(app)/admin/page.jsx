"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Bell, 
  Users, 
  BarChart3, 
  Settings,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    userCount: 0,
    resourceCount: 0,
    notificationCount: 0,
    tasksCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    const fetchAdminStats = async () => {
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
        
        // Fetch user count
        const { count: userCount, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        if (userError) throw userError;
        
        // Fetch resource count
        const { count: resourceCount, error: resourceError } = await supabase
          .from('resources')
          .select('*', { count: 'exact', head: true });
          
        if (resourceError) throw resourceError;
        
        // Fetch notification count
        const { count: notificationCount, error: notificationError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true });
          
        if (notificationError) throw notificationError;
        
        // Fetch tasks count
        const { count: tasksCount, error: tasksError } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true });
          
        if (tasksError) throw tasksError;
        
        setStats({
          userCount: userCount || 0,
          resourceCount: resourceCount || 0,
          notificationCount: notificationCount || 0,
          tasksCount: tasksCount || 0
        });
        
      } catch (error) {
        console.error('Error loading admin stats:', error.message);
        setError("Failed to load admin statistics. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminStats();
  }, [user, isAdmin]);
  
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
  
  const adminModules = [
    {
      title: "Notification Management",
      description: "Create and manage system notifications for users",
      icon: Bell,
      href: "/admin/notifications",
      color: "bg-blue-50 dark:bg-blue-900 text-blue-500 dark:text-blue-300"
    },
    {
      title: "User Management",
      description: "Manage user accounts, roles, and permissions",
      icon: Users,
      href: "/admin/users",
      color: "bg-purple-50 dark:bg-purple-900 text-purple-500 dark:text-purple-300"
    },
    {
      title: "Analytics",
      description: "View platform usage statistics and reports",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-green-50 dark:bg-green-900 text-green-500 dark:text-green-300"
    },
    {
      title: "System Settings",
      description: "Configure global system settings and defaults",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300"
    }
  ];
  
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center">
            <ShieldAlert className="h-8 w-8 mr-3 text-purple-500" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            System administration and management tools
          </p>
        </div>
      </div>
      
      {error && !error.includes("permission") && (
        <Card className="mb-6 border-red-300 dark:border-red-800">
          <CardContent className="pt-6 flex items-center">
            <AlertCircle className="text-red-500 h-5 w-5 mr-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resourceCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notificationCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasksCount}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Admin Modules */}
      <div className="grid gap-6 md:grid-cols-2">
        {adminModules.map((module) => (
          <Card key={module.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <div className={`p-2 rounded-md mr-3 ${module.color}`}>
                  <module.icon className="h-5 w-5" />
                </div>
                <CardTitle>{module.title}</CardTitle>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={module.href} className="w-full">
                <Button className="w-full">
                  Go to {module.title}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 