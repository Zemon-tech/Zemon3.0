"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileIcon, Search, Upload, Plus, Grid, List, FolderIcon, FileTextIcon, FileImageIcon, FileVideoIcon, ExternalLink } from "lucide-react";

export default function ResourcesPage() {
  // Mock resource data
  const resources = [
    { id: 1, type: "document", name: "Project Requirements", extension: "pdf", size: "1.2MB", uploadedBy: "John Doe", uploadDate: "Oct 10, 2023" },
    { id: 2, type: "document", name: "API Documentation", extension: "pdf", size: "3.5MB", uploadedBy: "Mike Johnson", uploadDate: "Oct 8, 2023" },
    { id: 3, type: "image", name: "Logo Design", extension: "png", size: "542KB", uploadedBy: "Jane Smith", uploadDate: "Oct 5, 2023" },
    { id: 4, type: "spreadsheet", name: "Project Timeline", extension: "xlsx", size: "890KB", uploadedBy: "Sarah Wilson", uploadDate: "Oct 2, 2023" },
    { id: 5, type: "link", name: "Design Inspiration", url: "https://example.com/design", addedBy: "Jane Smith", addDate: "Oct 1, 2023" },
    { id: 6, type: "video", name: "Product Demo", extension: "mp4", size: "15.8MB", uploadedBy: "Mike Johnson", uploadDate: "Sep 28, 2023" },
  ];

  // Categories for the sidebar
  const categories = [
    { name: "All Resources", count: resources.length },
    { name: "Documents", count: resources.filter(r => r.type === "document").length },
    { name: "Images", count: resources.filter(r => r.type === "image").length },
    { name: "Videos", count: resources.filter(r => r.type === "video").length },
    { name: "Spreadsheets", count: resources.filter(r => r.type === "spreadsheet").length },
    { name: "Links", count: resources.filter(r => r.type === "link").length },
  ];

  // Function to render the appropriate icon based on resource type
  const getResourceIcon = (resource) => {
    switch (resource.type) {
      case "document":
        return <FileTextIcon className="h-10 w-10 text-blue-500" />;
      case "image":
        return <FileImageIcon className="h-10 w-10 text-green-500" />;
      case "video":
        return <FileVideoIcon className="h-10 w-10 text-purple-500" />;
      case "spreadsheet":
        return <FileIcon className="h-10 w-10 text-orange-500" />;
      case "link":
        return <ExternalLink className="h-10 w-10 text-gray-500" />;
      default:
        return <FileIcon className="h-10 w-10 text-gray-500" />;
    }
  };

  // Render resource card for grid view
  const ResourceCard = ({ resource }) => (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-center h-20 bg-gray-50 dark:bg-gray-800 rounded mb-2">
          {getResourceIcon(resource)}
        </div>
        <CardTitle className="text-sm truncate">
          {resource.name}
          {resource.extension && `.${resource.extension}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
        {resource.size && <p>Size: {resource.size}</p>}
        {resource.url && <p className="truncate">URL: {resource.url}</p>}
        <p>
          {resource.uploadedBy || resource.addedBy} • {resource.uploadDate || resource.addDate}
        </p>
      </CardContent>
      <CardFooter className="p-2 border-t bg-gray-50 dark:bg-gray-800">
        <Button variant="ghost" size="sm" className="w-full text-xs">View</Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">Manage and share team resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search resources" className="pl-8" />
            </div>
          </div>
          
          <h3 className="font-medium mb-2">Categories</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.name}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>{category.name}</span>
                <span className="bg-gray-100 dark:bg-gray-800 text-muted-foreground rounded-full px-2 py-0.5 text-xs">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <h3 className="font-medium mb-2">Recent Folders</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
              <span>Project Assets</span>
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
              <span>Documentation</span>
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <FolderIcon className="h-4 w-4 mr-2 text-blue-500" />
              <span>Marketing Materials</span>
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Resources</h2>
            <div className="flex items-center border rounded-md">
              <Button variant="ghost" size="sm" className="h-8">
                <Grid className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" className="h-8">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="shared">Shared with me</TabsTrigger>
              <TabsTrigger value="starred">Starred</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="recent">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {resources.slice(0, 3).map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="shared">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No resources have been shared with you
              </div>
            </TabsContent>
            <TabsContent value="starred">
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                You haven't starred any resources
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 