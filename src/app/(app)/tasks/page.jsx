"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Filter, SortDesc } from "lucide-react";

export default function TasksPage() {
  // Mock task data
  const tasks = {
    todo: [
      { id: 1, title: "Create new landing page", assignee: "John Doe", priority: "High", dueDate: "Oct 15, 2023" },
      { id: 2, title: "Review design specs", assignee: "Jane Smith", priority: "Medium", dueDate: "Oct 20, 2023" },
    ],
    inProgress: [
      { id: 3, title: "Implement user authentication", assignee: "Mike Johnson", priority: "High", dueDate: "Oct 10, 2023" },
      { id: 4, title: "Update API documentation", assignee: "Sarah Wilson", priority: "Low", dueDate: "Oct 25, 2023" },
    ],
    review: [
      { id: 5, title: "Fix payment gateway bugs", assignee: "John Doe", priority: "Medium", dueDate: "Oct 12, 2023" },
    ],
    completed: [
      { id: 6, title: "Setup CI/CD pipeline", assignee: "Mike Johnson", priority: "High", dueDate: "Oct 5, 2023" },
      { id: 7, title: "Create user onboarding flow", assignee: "Sarah Wilson", priority: "Medium", dueDate: "Oct 8, 2023" },
    ],
  };

  // Function to render task card
  const TaskCard = ({ task }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              task.priority === 'High' 
                ? 'text-red-500 bg-red-50' 
                : task.priority === 'Medium' 
                  ? 'text-orange-500 bg-orange-50' 
                  : 'text-green-500 bg-green-50'
            }`}>
              {task.priority}
            </span>
            <span className="text-xs text-gray-500">#{task.id}</span>
          </div>
          <h3 className="font-medium">{task.title}</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Due: {task.dueDate}</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
              {task.assignee.split(' ').map(name => name[0]).join('')}
            </div>
            <span className="ml-2 text-gray-600">{task.assignee}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <SortDesc className="h-4 w-4 mr-2" />
            Sort
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-500">TO DO ({tasks.todo.length})</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg min-h-[500px]">
                {tasks.todo.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-500">IN PROGRESS ({tasks.inProgress.length})</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg min-h-[500px]">
                {tasks.inProgress.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-500">REVIEW ({tasks.review.length})</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg min-h-[500px]">
                {tasks.review.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-500">COMPLETED ({tasks.completed.length})</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg min-h-[500px]">
                {tasks.completed.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                View all tasks in a list format
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
              List view will be implemented here
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Task Calendar</CardTitle>
              <CardDescription>
                View tasks in a calendar format
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
              Calendar view will be implemented here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 