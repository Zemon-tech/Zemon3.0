"use client";

import { useState, useEffect } from "react";
import { 
  CalendarDays, 
  ChevronRight, 
  BarChart3, 
  Users, 
  BookOpen, 
  Activity,
  Sparkles,
  MessageSquare,
  FileText,
  PlusCircle,
  Clock,
  Trash2,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useNotifications } from "@/contexts/NotificationContext";
import { useMusic } from "@/contexts/MusicContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [kpiCards, setKpiCards] = useState([
    { id: 'total-students', title: 'Total Students', value: 25, change: '+10%', icon: Users },
    { id: 'active-courses', title: 'Active Courses', value: 8, change: '+2', icon: BookOpen },
    { id: 'resources', title: 'Resources', value: 42, change: '+6', icon: FileText },
    { id: 'active-users', title: 'Active Users', value: 18, change: '+3', icon: Activity },
    { id: 'ai-experiments', title: 'AI Experiments', value: 12, change: '+5', icon: Sparkles },
    { id: 'chat-threads', title: 'Chat Threads', value: 27, change: '+4', icon: MessageSquare },
  ]);
  
  const { notifications } = useNotifications();
  const { currentTrack } = useMusic();
  const { user, userData } = useAuth();
  
  // Activity feed with live updates
  const [activityFeed, setActivityFeed] = useState([...recentActivity]);
  
  // Unread notification count
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  // Handle drag end for KPI cards
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(kpiCards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setKpiCards(items);
  };
  
  // Generate sparkline data for KPI cards
  const generateSparklineData = (id) => {
    const points = [];
    // Generate different patterns based on card id
    switch (id) {
      case 'total-students':
        for (let i = 0; i < 10; i++) {
          points.push(20 + Math.floor(Math.random() * 10));
        }
        break;
      case 'ai-experiments':
        for (let i = 0; i < 10; i++) {
          points.push(5 + Math.floor(Math.random() * 8) + i);
        }
        break;
      default:
        for (let i = 0; i < 10; i++) {
          points.push(10 + Math.floor(Math.random() * 20));
        }
    }
    return points;
  };
  
  // Draw sparkline for a KPI card
  const renderSparkline = (id, height = 30) => {
    const data = generateSparklineData(id);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    // Calculate points for SVG path
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="100%" height={height} className="mt-2 overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-blue-500 dark:text-blue-400"
        />
      </svg>
    );
  };
  
  // Add a new activity to the feed
  useEffect(() => {
    const interval = setInterval(() => {
      const randomActivity = {
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        time: "Just now"
      };
      
      setActivityFeed(prev => [randomActivity, ...prev.slice(0, 9)]);
    }, 20000); // Every 20 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            {unreadNotifications > 0 && (
              <Button variant="outline" className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                {unreadNotifications} new notifications
              </Button>
            )}
            <Button>Download</Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Draggable KPI Cards */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="kpi-cards" direction="horizontal">
                {(provided) => (
                  <div 
                    className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {kpiCards.map((card, index) => {
                      const Icon = card.icon;
                      return (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "transition-shadow group hover:shadow-md", 
                                snapshot.isDragging ? "shadow-lg" : ""
                              )}
                            >
                              <div 
                                {...provided.dragHandleProps}
                                className="absolute right-3 top-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                  {card.title}
                                </CardTitle>
                                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-xs text-muted-foreground">
                                  {card.change} from last month
                                </p>
                                {renderSparkline(card.id)}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    
                    {/* Add Card Button */}
                    <Card className="border-dashed border-2 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer h-[140px]">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add Widget</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Activity Feed */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Live Activity Feed</CardTitle>
                  <CardDescription>
                    Real-time actions from students and faculty
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                    {activityFeed.map((activity, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center rounded-lg border p-3",
                          index === 0 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""
                        )}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.user}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.action}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {index === 0 && (
                            <span className="mr-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full">
                              New
                            </span>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Calendar */}
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                  <CardDescription>
                    Upcoming events and deadlines
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Calendar />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>
                    Events scheduled for the next few weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <CalendarDays className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {event.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`mr-2 rounded-full px-2 py-1 text-xs ${
                              event.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : event.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {event.priority}
                          </span>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Currently Playing & Music Widget */}
              <Card>
                <CardHeader>
                  <CardTitle>Now Playing</CardTitle>
                  <CardDescription>
                    Team collaborative playlist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentTrack ? (
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-md flex-shrink-0 overflow-hidden">
                        {currentTrack.thumbnail ? (
                          <img 
                            src={currentTrack.thumbnail} 
                            alt={currentTrack.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BarChart3 className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold">{currentTrack.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{currentTrack.artist}</p>
                        
                        <div className="mt-2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-1/3 rounded-full"></div>
                        </div>
                        
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                          <span>1:05</span>
                          <span>3:25</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p>No music currently playing</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Start Playing
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-2">Playlist</h4>
                    <div className="space-y-2">
                      {playlist.map((track, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className="text-gray-500 w-5 text-center">{index + 1}</span>
                            <div className="truncate">
                              <span className="font-medium">{track.title}</span>
                              <span className="text-gray-500 text-xs ml-1">- {track.artist}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">Analytics content</TabsContent>
          <TabsContent value="reports">Reports content</TabsContent>
          <TabsContent value="resources">Resources content</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const recentActivity = [
  {
    user: "Alice Johnson",
    action: "Submitted assignment for Computer Science 101",
    time: "2 hours ago",
  },
  {
    user: "David Smith",
    action: "Commented on Biology lecture notes",
    time: "3 hours ago",
  },
  {
    user: "Emma Wilson",
    action: "Registered for Advanced Mathematics",
    time: "5 hours ago",
  },
  {
    user: "John Doe",
    action: "Uploaded new resource for Physics",
    time: "Yesterday",
  },
  {
    user: "Sophia Brown",
    action: "Completed course evaluation",
    time: "2 days ago",
  },
];

const upcomingEvents = [
  {
    title: "Midterm Examination",
    date: "Oct 15, 2023",
    priority: "High",
  },
  {
    title: "Group Project Presentation",
    date: "Oct 20, 2023",
    priority: "Medium",
  },
  {
    title: "Guest Lecture: AI in Education",
    date: "Oct 25, 2023",
    priority: "Low",
  },
  {
    title: "Course Registration Deadline",
    date: "Nov 1, 2023",
    priority: "High",
  },
];

const playlist = [
  { title: "Productivity Mix", artist: "Focus Playlist" },
  { title: "Coding Beats", artist: "Developer Flow" },
  { title: "Ambient Study", artist: "Brain Food" },
  { title: "Friday Vibes", artist: "Team Playlist" },
];

// For random activity generation
const users = [
  "Alice Johnson", 
  "David Smith", 
  "Emma Wilson", 
  "John Doe", 
  "Sophia Brown", 
  "Michael Chen", 
  "Sarah Parker"
];

const actions = [
  "Submitted a new project",
  "Commented on a document",
  "Uploaded a resource",
  "Started a new chat",
  "Completed an AI task",
  "Added music to playlist",
  "Shared results with team"
]; 