"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { MusicProvider } from "@/contexts/MusicContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MusicPlayer } from "@/components/layout/MusicPlayer";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { SearchModal } from "@/components/search/SearchModal";
import { Toaster } from "sonner";
import { 
  LayoutGrid, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  Moon,
  Sun,
  Sparkles,
  Music,
  Search,
  ShieldAlert,
  Users,
  Bell
} from "lucide-react";

export function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user, userData, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userData || !userData.name) return 'U';
    return userData.name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Basic navigation items for all users
  let navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "AI Assistant", href: "/ai", icon: Sparkles },
    { name: "Music", href: "/music", icon: Music },
    { name: "Resources", href: "/resources", icon: FileText },
    { name: "Victory Wall", href: "/victory-wall", icon: CheckSquare },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Add admin section if user is an admin
  if (isAdmin) {
    navigation = [
      ...navigation,
      { name: "Admin", href: "/admin", icon: ShieldAlert, divider: true },
      { name: "Notifications", href: "/admin/notifications", icon: Bell, isSubItem: true },
      { name: "User Management", href: "/admin/users", icon: Users, isSubItem: true },
    ];
  }

  return (
    <MusicProvider>
      <NotificationProvider>
        <div className="h-screen flex flex-col">
          {/* Header */}
          <header className="h-16 px-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800 z-10">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 dark:text-white dark:hover:bg-gray-800">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold dark:text-white">Team Management</h1>
            </div>
            
            {/* Global search */}
            <div className="hidden md:flex items-center max-w-md w-full mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search documentation, tools, tutorials..."
                  className="w-full h-9 pl-10 pr-4 rounded-full bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-primary/50 dark:text-gray-200"
                  onClick={toggleSearch}
                  readOnly
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Music Player */}
              <div className="mr-2">
                <MusicPlayer />
              </div>
              
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="dark:hover:bg-gray-800 dark:text-gray-200">
                {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
              </Button>
              
              {/* Mobile search button */}
              <Button variant="ghost" size="icon" className="md:hidden dark:hover:bg-gray-800 dark:text-gray-200" onClick={toggleSearch}>
                <Search className="h-5 w-5" />
              </Button>
              
              {/* Notification Badge */}
              <NotificationBadge />
              
              <div className="flex items-center">
                {userData && (
                  <span className="mr-2 text-sm font-medium hidden sm:block dark:text-gray-200">
                    {userData.name || user?.email || 'User'}
                    {isAdmin && (
                      <span className="ml-1 text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 rounded">
                        Admin
                      </span>
                    )}
                  </span>
                )}
                <Avatar>
                  <AvatarFallback className="dark:bg-gray-800 dark:text-gray-200">{getUserInitials()}</AvatarFallback>
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
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.divider && (
                      <div className="h-px bg-gray-200 dark:bg-gray-800 my-3 mx-2" />
                    )}
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        item.isSubItem && "pl-10",
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                          ? "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/70"
                      )}
                    >
                      {item.icon && (
                        <item.icon 
                          className={cn(
                            "mr-3 h-5 w-5",
                            pathname === item.href || pathname.startsWith(`${item.href}/`)
                              ? "text-primary dark:text-primary"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-600"
                          )}
                          aria-hidden="true" 
                        />
                      )}
                      {item.name}
                    </Link>
                  </div>
                ))}
              </nav>
              
              <div className="w-64 p-4 border-t dark:border-gray-800">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700"
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
          
          {/* Notification Panel */}
          <NotificationPanel />
          
          {/* Global Search Modal */}
          <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          
          {/* Toast Container */}
          <Toaster position="top-right" richColors closeButton />
          
          {/* Audio player containers */}
          <div id="audio-containers" style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden', zIndex: -1 }}>
            <div id="soundcloud-container"></div>
            <div id="youtube-player"></div>
          </div>
        </div>
      </NotificationProvider>
    </MusicProvider>
  );
} 