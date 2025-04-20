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
  ExternalLink, Trash2, Edit, WrenchIcon,
  PencilIcon, TrashIcon, ExternalLinkIcon, DownloadIcon
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogFooter, DialogTrigger, DialogClose, DialogDescription
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayCircleIcon } from "@/components/icons/PlayCircleIcon";
import { LinkIcon } from "@/components/icons/LinkIcon";

export default function ResourcesPage() {
  const [resources, setResources] = useState(null);
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

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editResourceHasFile, setEditResourceHasFile] = useState(false);
  const [editFileUrl, setEditFileUrl] = useState("");

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
    if (!resources) {
      setFilteredResources([]);
      return;
    }
    
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
        .select('*');
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, handle gracefully
          console.error('The resources table does not exist yet. Make sure to run migrations.');
          setResources([]);
          setFilteredResources([]);
        } else {
          throw error;
        }
      } else {
        setResources(data || []);
        setFilteredResources(data || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
      setFilteredResources([]);
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
        if (error.code === '42P01') {
          console.error('The resources table does not exist yet. Make sure to run migrations.');
          alert('Cannot add resources: The resources database is not yet set up.');
        } else {
          console.error('Error inserting resource data:', error);
          throw error;
        }
      } else {
        console.log('Resource added successfully:', data);
      }
      
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
    if (!resourceType) return false;
    return resourceType === "documentation";
  };

  // Helper function to identify spreadsheet types
  const isSpreadsheetType = (resourceType) => {
    if (!resourceType) return false;
    return ["spreadsheet", "xlsx", "xls", "csv"].includes(resourceType);
  };

  // Helper function to identify tool types
  const isToolType = (resourceType) => {
    if (!resourceType) return false;
    return resourceType === "tool";
  };

  // Function to render the appropriate icon based on resource type
  const getResourceIcon = (resource) => {
    const iconClass = "transition-transform group-hover:scale-110 duration-200";
    
    if (!resource || !resource.type) {
      return <FileIcon className={`h-14 w-14 text-gray-500 ${iconClass}`} />;
    }
    
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
    // Get accent color based on resource type
    const getTypeStyles = () => {
      switch(resource.type) {
        case "documentation":
          return {
            iconColor: "text-blue-500",
            bgColor: "bg-blue-50 dark:bg-blue-900/10",
            tagBg: "bg-blue-100 dark:bg-blue-800/30",
            tagText: "text-blue-800 dark:text-blue-300",
            borderColor: "border-blue-200 dark:border-blue-800/50"
          };
        case "video":
          return {
            iconColor: "text-purple-500",
            bgColor: "bg-purple-50 dark:bg-purple-900/10",
            tagBg: "bg-purple-100 dark:bg-purple-800/30",
            tagText: "text-purple-800 dark:text-purple-300",
            borderColor: "border-purple-200 dark:border-purple-800/50"
          };
        case "tool":
          return {
            iconColor: "text-green-500",
            bgColor: "bg-green-50 dark:bg-green-900/10",
            tagBg: "bg-green-100 dark:bg-green-800/30",
            tagText: "text-green-800 dark:text-green-300",
            borderColor: "border-green-200 dark:border-green-800/50"
          };
        default:
          return {
            iconColor: "text-gray-500",
            bgColor: "bg-gray-50 dark:bg-gray-800/50",
            tagBg: "bg-gray-100 dark:bg-gray-700",
            tagText: "text-gray-700 dark:text-gray-300",
            borderColor: "border-gray-200 dark:border-gray-700"
          };
      }
    };

    const styles = getTypeStyles();
    
    return (
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
        <div className={`flex items-center justify-center h-32 ${styles.bgColor}`}>
          {getResourceIcon(resource)}
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
            {resource.title}
          </h3>
          
          {resource.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {resource.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {resource.type && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles.tagBg} ${styles.tagText}`}>
                {formatResourceType(resource.type)}
              </span>
            )}
            {resource.created_at && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(resource.created_at)}
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex justify-between border-t border-gray-100 dark:border-gray-700">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => handleEditResource(resource)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-gray-600 dark:text-gray-400"
            onClick={() => window.open(resource.url, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => deleteResource(resource.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const resetEditForm = () => {
    setEditTitle("");
    setEditDescription("");
    setEditType("");
    setEditUrl("");
    setEditFile(null);
    setEditResourceHasFile(false);
    setEditFileUrl("");
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Resources
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage and share team resources
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setAddDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex h-[calc(100%-125px)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-auto flex-shrink-0">
          <div className="p-4">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input 
                  placeholder="Search resources" 
                  className="pl-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <h3 className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400 mb-3 px-2">Categories</h3>
            <div className="space-y-1">
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                  selectedType === "all" 
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
                onClick={() => setSelectedType("all")}
              >
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">All Resources</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedType === "all"
                    ? "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {resources?.length || 0}
                </span>
              </button>
              
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                  selectedType === "documentation" 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
                onClick={() => setSelectedType("documentation")}
              >
                <div className="flex items-center">
                  <FileTextIcon className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Documentation</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedType === "documentation"
                    ? "bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-300"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {resources?.filter(r => isDocumentationType(r.type)).length || 0}
                </span>
              </button>
              
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                  selectedType === "tool" 
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
                onClick={() => setSelectedType("tool")}
              >
                <div className="flex items-center">
                  <WrenchIcon className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">Tools</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedType === "tool"
                    ? "bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {resources?.filter(r => isToolType(r.type)).length || 0}
                </span>
              </button>
              
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                  selectedType === "video" 
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
                onClick={() => setSelectedType("video")}
              >
                <div className="flex items-center">
                  <FileVideoIcon className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">Videos</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedType === "video"
                    ? "bg-purple-100 dark:bg-purple-800/50 text-purple-800 dark:text-purple-300"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {resources?.filter(r => r.type === "video").length || 0}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {selectedType === "all" ? "All Resources" : 
               selectedType === "documentation" ? "Documentation" :
               selectedType === "tool" ? "Tools" :
               selectedType === "video" ? "Videos" : "Resources"}
            </h2>
            
            <Tabs defaultValue="all" className="ml-auto">
              <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">All</TabsTrigger>
                <TabsTrigger value="recent" className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">Recent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <Tabs defaultValue="all" className="space-y-4">
            <TabsContent value="all">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white animate-spin"></div>
                </div>
              ) : resources === null ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <FileIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="mb-2 text-lg text-red-500 font-medium">The resources database is not yet set up.</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">Please run the database migrations to initialize the tables.</p>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mt-2 text-left max-w-md shadow-sm">
                    <p className="text-sm font-medium mb-2">Run these commands in your terminal:</p>
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded block mb-2 font-mono">
                      cd {`{project-directory}`}<br/>
                      npx supabase migration up
                    </code>
                  </div>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No resources found</p>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    {searchQuery ? 
                      "Try adjusting your search or filter criteria to find what you're looking for." : 
                      "Get started by adding your first resource with the 'Add Resource' button."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white animate-spin"></div>
                </div>
              ) : resources === null ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <FileIcon className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="mb-2 text-lg text-red-500 font-medium">The resources database is not yet set up.</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">Please run the database migrations to initialize the tables.</p>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mt-2 text-left max-w-md shadow-sm">
                    <p className="text-sm font-medium mb-2">Run these commands in your terminal:</p>
                    <code className="text-xs bg-gray-200 dark:bg-gray-700 p-2 rounded block mb-2 font-mono">
                      cd {`{project-directory}`}<br/>
                      npx supabase migration up
                    </code>
                  </div>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No recent resources</p>
                  <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Try adding a new resource to see it appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.slice(0, 4).map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new resource to the library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="border-gray-200 dark:border-gray-700">
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
              <label htmlFor="url" className="text-sm font-medium">URL (for links)</label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="file" className="text-sm font-medium">Upload File</label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setAddDialogOpen(false);
            }} className="border-gray-200 dark:border-gray-700">
              Cancel
            </Button>
            <Button onClick={addResource} className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200">
              Add Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update the resource details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-type" className="text-sm font-medium">Type</label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger className="border-gray-200 dark:border-gray-700">
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
              <label htmlFor="edit-url" className="text-sm font-medium">URL (for links)</label>
              <Input
                id="edit-url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com"
                className="border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-file" className="text-sm font-medium">Upload File (optional)</label>
              <Input
                id="edit-file"
                type="file"
                onChange={(e) => setEditFile(e.target.files[0])}
                className="border-gray-200 dark:border-gray-700"
              />
              {editResourceHasFile && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FileIcon className="h-4 w-4" />
                  <span>Current file: {editFileUrl?.split('/').pop()}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetEditForm();
                setEditDialogOpen(false);
              }}
              className="border-gray-200 dark:border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={updateResource} 
              className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Update Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 