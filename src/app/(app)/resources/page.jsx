"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileIcon, Search, Plus, Grid, List, 
  FileTextIcon, FileImageIcon, FileVideoIcon, 
  ExternalLink, Trash2, Edit, WrenchIcon
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogTrigger, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("");
  const [resourceToEdit, setResourceToEdit] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Dialog open states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);

  // Fetch current user on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch resources from Supabase
  useEffect(() => {
    fetchResources();
  }, []);

  // Filter resources based on search query and selected type
  useEffect(() => {
    let results = resources;
    
    // Filter by search query
    if (searchQuery) {
      results = results.filter(resource => 
        resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by resource type
    if (selectedType && selectedType !== "all") {
      if (selectedType === "documentation") {
        // Group documents and spreadsheets under documentation
        results = results.filter(resource => 
          resource.type === "documentation" || 
          isDocumentationType(resource.type) ||
          isSpreadsheetType(resource.type)
        );
      } else {
        results = results.filter(resource => resource.type === selectedType);
      }
    }
    
    setFilteredResources(results);
  }, [resources, searchQuery, selectedType]);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          uploader:uploaded_by(name, email)
        `);
      
      if (error) throw error;
      
      // Transform the data to include uploader name directly
      const transformedData = data?.map(resource => ({
        ...resource,
        // Use name if available, otherwise fallback to email
        uploader_name: resource.uploader?.name || resource.uploader?.email
      })) || [];
      
      setResources(transformedData);
      setFilteredResources(transformedData);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addResource = async () => {
    try {
      // Check if user is logged in
      if (!currentUser) {
        alert("You must be logged in to add resources");
        return;
      }
      
      // Validate required fields
      if (!title) {
        console.error('Title is required');
        return;
      }
      
      if (!type) {
        console.error('Type is required');
        return;
      }
      
      // For link type, URL is required
      if (type === "link" && !url) {
        console.error('URL is required for link resources');
        return;
      }
      
      // If not uploading a file and not a link, URL is required
      if (!file && type !== "link" && !url) {
        console.error('Either a file or URL must be provided');
        return;
      }
      
      let resourceData = {
        title,
        description,
        type,
        url,
        uploaded_by: currentUser.id,
        created_at: new Date().toISOString()
      };
      
      if (file) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `resources/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('resources')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }
        
        const { data } = supabase.storage.from('resources').getPublicUrl(filePath);
        resourceData.url = data.publicUrl;
      }
      
      const { data, error } = await supabase
        .from('resources')
        .insert(resourceData)
        .select();
      
      if (error) {
        console.error('Error inserting resource data:', error);
        throw error;
      }
      
      console.log('Resource added successfully:', data);
      
      // Close dialog and reset form
      setAddDialogOpen(false);
      resetForm();
      // Refresh resources list
      fetchResources();
    } catch (error) {
      console.error('Error adding resource:', error.message || error);
    }
  };

  const updateResource = async () => {
    if (!resourceToEdit) return;
    
    try {
      // Check if user is logged in
      if (!currentUser) {
        alert("You must be logged in to update resources");
        return;
      }
      
      // Validate required fields
      if (!title) {
        console.error('Title is required');
        return;
      }
      
      if (!type) {
        console.error('Type is required');
        return;
      }
      
      let resourceData = {
        title,
        description,
        type,
        url,
        updated_at: new Date().toISOString()
      };
      
      if (file) {
        // Upload new file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `resources/${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('resources')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }
        
        const { data } = supabase.storage.from('resources').getPublicUrl(filePath);
        resourceData.url = data.publicUrl;
      }
      
      const { data, error } = await supabase
        .from('resources')
        .update(resourceData)
        .eq('id', resourceToEdit.id)
        .select();
        
      if (error) {
        console.error('Error updating resource:', error);
        throw error;
      }
      
      console.log('Resource updated successfully:', data);
      
      // Close dialog and reset form
      setEditDialogOpen(false);
      setResourceToEdit(null);
      resetForm();
      // Refresh resources list
      fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error.message || error);
    }
  };

  const deleteResource = async (id) => {
    try {
      // Check if user is logged in
      if (!currentUser) {
        alert("You must be logged in to delete resources");
        return;
      }
      
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh resources list
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("");
    setUrl("");
    setFile(null);
  };

  const handleEditResource = (resource) => {
    setResourceToEdit(resource);
    setTitle(resource.title || "");
    setDescription(resource.description || "");
    setType(resource.type || "");
    setUrl(resource.url || "");
    setEditDialogOpen(true);
  };

  // Helper function to identify document types
  const isDocumentationType = (resourceType) => {
    return resourceType === "documentation";
  };

  // Helper function to identify spreadsheet types
  const isSpreadsheetType = (resourceType) => {
    return ["spreadsheet", "xlsx", "xls", "csv"].includes(resourceType);
  };

  // Helper function to identify tool types
  const isToolType = (resourceType) => {
    return resourceType === "tool";
  };

  // Function to render the appropriate icon based on resource type
  const getResourceIcon = (resource) => {
    const iconClass = "transition-transform group-hover:scale-110 duration-200";
    
    switch(resource.type) {
      case "documentation":
        return <FileTextIcon className={`h-14 w-14 text-blue-500 ${iconClass}`} />;
      case "video":
        return <FileVideoIcon className={`h-14 w-14 text-purple-500 ${iconClass}`} />;
      case "tool": 
        return <WrenchIcon className={`h-14 w-14 text-green-500 ${iconClass}`} />;
      default:
        return <FileIcon className={`h-14 w-14 text-gray-500 ${iconClass}`} />;
    }
  };

  // Format type for display
  const formatResourceType = (type) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Render resource card for grid view
  const ResourceCard = ({ resource }) => {
    // Determine background color based on resource type
    const getBgColor = () => {
      switch(resource.type) {
        case "documentation":
          return "bg-blue-50 dark:bg-blue-900/20";
        case "video":
          return "bg-purple-50 dark:bg-purple-900/20";
        case "tool":
          return "bg-green-50 dark:bg-green-900/20";
        default:
          return "bg-gray-50 dark:bg-gray-800";
      }
    };

    return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-3">
        <div className={`group flex items-center justify-center h-24 rounded mb-2 ${getBgColor()}`}>
          {getResourceIcon(resource)}
        </div>
        <CardTitle className="text-base font-medium truncate">
          {resource.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex flex-col h-20">
        {resource.description && (
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {resource.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            {formatResourceType(resource.type)}
          </span>
          {resource.created_at && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(resource.created_at)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-2 border-t bg-gray-50 dark:bg-gray-800 flex justify-between">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.open(resource.url, "_blank")}>View</Button>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs p-1" 
            onClick={() => handleEditResource(resource)}
          >
            <Edit className="h-4 w-4 text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs p-1" onClick={() => deleteResource(resource.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardFooter>
    </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">Manage and share team resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="documentation">Documentation</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new resource to the library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description">Description</label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="type">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="url">URL (for links)</label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="file">Upload File</label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setAddDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={addResource}>
              Add Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the resource details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-title">Title</label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-description">Description</label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-type">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-url">URL</label>
              <Input
                id="edit-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-file">Upload New File</label>
              <Input
                id="edit-file"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setResourceToEdit(null);
              setEditDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={updateResource}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources" 
                className="pl-8" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <h3 className="font-semibold text-base mb-3">Categories</h3>
          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSelectedType("all")}
            >
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">All Resources</span>
              </div>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-bold">
                {resources.length}
              </span>
            </button>
            
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSelectedType("documentation")}
            >
              <div className="flex items-center">
                <FileTextIcon className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium">Documentation</span>
              </div>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-bold">
                {resources.filter(r => isDocumentationType(r.type)).length}
              </span>
            </button>
            
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSelectedType("tool")}
            >
              <div className="flex items-center">
                <WrenchIcon className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm font-medium">Tools</span>
              </div>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-bold">
                {resources.filter(r => isToolType(r.type)).length}
              </span>
            </button>
            
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setSelectedType("video")}
            >
              <div className="flex items-center">
                <FileVideoIcon className="h-4 w-4 mr-2 text-purple-500" />
                <span className="text-sm font-medium">Videos</span>
              </div>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs font-bold">
                {resources.filter(r => r.type === "video").length}
              </span>
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedType ? 
                (selectedType.charAt(0).toUpperCase() + selectedType.slice(1)) : 
                "All Resources"}
            </h2>
          </div>
          
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  Loading resources...
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No resources found
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="recent">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  Loading resources...
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No recent resources
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredResources.slice(0, 4).map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 