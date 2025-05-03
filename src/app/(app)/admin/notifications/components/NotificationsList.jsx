"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Search, Eye, Filter, Bell, MessageSquare, CheckSquare, Calendar, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NotificationsList({ notifications, users }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  
  // Find user by id
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name || user.email : "Unknown user";
  };
  
  // Get icon for notification type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'system':
        return <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'event':
        return <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
      case 'resource':
        return <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };
  
  // Get styled badge for severity
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'error':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40">High</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/40">Medium</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40">Normal</Badge>;
      default: // info
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40">Low</Badge>;
    }
  };
  
  // Format date nicely
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Apply filters to notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Filter by search term
    const matchesSearch =
      searchTerm === "" ||
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by type
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    
    // Filter by severity
    const matchesSeverity = severityFilter === "all" || notification.severity === severityFilter;
    
    return matchesSearch && matchesType && matchesSeverity;
  });
  
  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search notifications..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="w-40">
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-40">
            <Select
              value={severityFilter}
              onValueChange={setSeverityFilter}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="error">High</SelectItem>
                <SelectItem value="warning">Medium</SelectItem>
                <SelectItem value="success">Normal</SelectItem>
                <SelectItem value="info">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Showing {filteredNotifications.length} of {notifications.length} notifications
      </div>
      
      {/* Notifications table */}
      <div className="border rounded-lg overflow-hidden dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-xs uppercase dark:text-gray-300">
                <th className="px-4 py-3 text-left">Notification</th>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/70 dark:text-white">
                    <td className="px-4 py-3">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {notification.message}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {getUserName(notification.user_id)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="mr-2">{getTypeIcon(notification.type)}</span>
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getSeverityBadge(notification.severity)}
                    </td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">
                      {formatDate(notification.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={notification.read ? "outline" : "default"} className={notification.read ? "dark:border-gray-600 dark:text-gray-400" : ""}>
                        {notification.read ? "Read" : "Unread"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="dark:hover:bg-gray-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            Resend
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No notifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 