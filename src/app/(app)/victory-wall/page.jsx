"use client";

import { useState, useEffect } from "react";
import { AnimatedHeroBanner } from "./components/AnimatedHeroBanner";
import { ProjectCard } from "./components/ProjectCard";
import { FilterBar } from "./components/FilterBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusIcon, Calendar, Image, Users } from "lucide-react";
import { format } from "date-fns";

export default function VictoryWallPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filterValue, setFilterValue] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isTeamAchievement, setIsTeamAchievement] = useState(false);
  const [achievementDate, setAchievementDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('victory_wall')
          .select('*')
          .order('achievement_date', { ascending: false });
        
        if (error) {
          console.error('Error fetching projects:', error.message);
          return;
        }
        
        setProjects(data || []);
        setFilteredProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we're mounted
    let isMounted = true;
    
    if (isMounted) {
      fetchProjects();
    }

    return () => {
      isMounted = false;
    };
  }, [/* no dependencies needed */]);
  
  const handleFilterChange = (value) => {
    setFilterValue(value);
    
    if (value === "all") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter(project => 
          project.category?.toLowerCase() === value.toLowerCase()
        )
      );
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    try {
      if (!user) {
        alert('You must be logged in to create achievements');
        return;
      }

      if (!isAdmin) {
        alert('Only admins can create achievements');
        return;
      }
      
      const { data, error } = await supabase
        .from('victory_wall')
        .insert({
          title,
          description,
          image_url: imageUrl,
          is_team_achievement: isTeamAchievement,
          user_id: user.id,
          achievement_date: new Date(achievementDate).toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST301') {
          alert('You do not have permission to create achievements. Please contact an administrator.');
        } else {
          alert(`Failed to create achievement: ${error.message}`);
        }
        return;
      }

      // Add new project to state
      setProjects([data, ...projects]);
      setFilteredProjects([data, ...filteredProjects]);

      // Reset form
      setTitle("");
      setDescription("");
      setImageUrl("");
      setIsTeamAchievement(false);
      setAchievementDate(new Date().toISOString().split('T')[0]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create achievement. Please try again.');
    }
  };

  const categories = ["All", "Analytics", "AI", "Automation", "Fintech", "Logistics"];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-purple-900 to-purple-800">
        <div className="h-[400px] flex items-center justify-center text-center">
          <div className="px-6">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Victory Wall
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
              Celebrating our team's achievements and completed projects
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          {/* Filter Bar */}
          <FilterBar 
            categories={categories} 
            activeFilter={filterValue} 
            onChange={handleFilterChange} 
          />

          {/* Add Project Button (Admin Only) */}
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ml-4 bg-purple-600 hover:bg-purple-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Achievement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-purple-600">Add New Achievement</DialogTitle>
                  <DialogDescription className="text-gray-500 dark:text-gray-400">
                    Fill in the details below to create a new achievement for the Victory Wall.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Achievement Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a memorable title"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the achievement and its impact"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Image URL
                    </Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter the URL of an image representing the achievement"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="achievementDate" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Achievement Date
                    </Label>
                    <Input
                      id="achievementDate"
                      type="date"
                      value={achievementDate}
                      onChange={(e) => setAchievementDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <Users className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="isTeamAchievement" className="text-sm font-medium cursor-pointer select-none">
                      Team Achievement
                    </Label>
                    <input
                      type="checkbox"
                      id="isTeamAchievement"
                      checked={isTeamAchievement}
                      onChange={(e) => setIsTeamAchievement(e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Create Achievement
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 