"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { 
  LayoutGrid, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  Moon,
  Sun,
  Sparkles
} from "lucide-react";

export function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Fetch user data from the database if authenticated
    const fetchUserData = async () => {
      if (user && user.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('name, email, role')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error.message);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData || !userData.name) return 'U';
    return userData.name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "AI Assistant", href: "/ai", icon: Sparkles },
    { name: "Resources", href: "/resources", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="h-16 px-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800 z-10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Team Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            {userData && (
              <span className="mr-2 text-sm font-medium">
                {userData.name || 'User'}
              </span>
            )}
            <Avatar>
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - use width transitions and overflow hidden */}
        <aside 
          className={cn(
            "border-r bg-gray-50 dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 overflow-hidden",
            isSidebarOpen ? "w-64" : "w-0"
          )}
        >
          <nav className="w-64 flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname === item.href
                      ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="w-64 p-4 border-t dark:border-gray-800">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
} 