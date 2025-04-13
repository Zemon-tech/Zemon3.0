"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, LoaderCircle, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  // Mock data for dashboard
  const taskStats = {
    total: 12,
    completed: 5,
    inProgress: 4,
    pending: 2,
    overdue: 1,
  };

  const recentActivity = [
    { id: 1, user: "John Doe", action: "completed", task: "Update user documentation", time: "2 hours ago" },
    { id: 2, user: "Jane Smith", action: "commented on", task: "API integration", time: "3 hours ago" },
    { id: 3, user: "Mike Johnson", action: "created", task: "Design new landing page", time: "5 hours ago" },
    { id: 4, user: "Sarah Wilson", action: "assigned", task: "Fix login bug", time: "1 day ago" },
  ];

  const upcomingTasks = [
    { id: 1, title: "Team meeting", dueDate: "Today, 2:00 PM", priority: "High" },
    { id: 2, title: "Code review", dueDate: "Tomorrow, 10:00 AM", priority: "Medium" },
    { id: 3, title: "Update documentation", dueDate: "Oct 15, 2023", priority: "Low" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your team's progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              +2 since last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((taskStats.completed / taskStats.total) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <LoaderCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((taskStats.inProgress / taskStats.total) * 100)}% of all tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your team's latest actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-700">
                        {activity.user.split(' ').map(name => name[0]).join('')}
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">
                          <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-medium text-blue-600">{activity.task}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>
                  Tasks due soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center">
                      <div className="mr-4 h-8 w-8 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <Clock className={`h-4 w-4 ${task.priority === 'High' ? 'text-red-500' : task.priority === 'Medium' ? 'text-orange-500' : 'text-green-500'}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium leading-none">{task.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                      </div>
                      <div className={`text-xs font-medium ${
                        task.priority === 'High' 
                          ? 'text-red-500 bg-red-50' 
                          : task.priority === 'Medium' 
                            ? 'text-orange-500 bg-orange-50' 
                            : 'text-green-500 bg-green-50'
                      } rounded-full px-2 py-1`}>
                        {task.priority}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View detailed statistics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Analytics charts will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Access and download team reports
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
              Report generation tools will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 