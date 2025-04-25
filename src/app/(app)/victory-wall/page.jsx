"use client";

import { useState, useEffect } from "react";
import { AnimatedHeroBanner } from "./components/AnimatedHeroBanner";
import { ProjectCard } from "./components/ProjectCard";
import { FilterBar } from "./components/FilterBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function VictoryWallPage() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filterValue, setFilterValue] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('completed_projects')
          .select('*')
          .order('completion_date', { ascending: false });
        
        if (error) throw error;
        
        setProjects(data || []);
        setFilteredProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);
  
  const handleFilterChange = (value) => {
    setFilterValue(value);
    
    if (value === "all") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter(project => 
          project.category.toLowerCase() === value.toLowerCase()
        )
      );
    }
  };

  // For demonstration purposes - to be replaced with actual data
  useEffect(() => {
    if (projects.length === 0 && !isLoading) {
      // Mock data for demonstration
      const mockProjects = [
        {
          id: 1,
          title: "Data Analytics Dashboard",
          description: "Interactive visualization platform for real-time business metrics",
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
          completion_date: "2023-04-15",
          category: "Analytics",
          team: ["Alice Johnson", "Bob Smith", "Charlie Brown"],
          metrics: {
            roi: "142%",
            time_saved: "23 hours/week",
            user_satisfaction: 4.8
          },
          badges: ["High Impact", "Innovative", "User Favorite"]
        },
        {
          id: 2,
          title: "AI-Powered Content Generator",
          description: "Machine learning tool that creates marketing copy and social media posts",
          image: "https://images.unsplash.com/photo-1677442135968-6276fe6e771e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
          completion_date: "2023-06-22",
          category: "AI",
          team: ["Diana Prince", "Erik Stevens", "Fiona Chen"],
          metrics: {
            content_produced: "500+ pieces",
            time_saved: "40 hours/month",
            accuracy: "92%"
          },
          badges: ["Time Saver", "AI Excellence"]
        },
        {
          id: 3,
          title: "Customer Support Chatbot",
          description: "24/7 automated support assistant with natural language processing",
          image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2206&q=80",
          completion_date: "2023-08-10",
          category: "Automation",
          team: ["Grace Kim", "Henry Ford", "Irene Zhang"],
          metrics: {
            response_time: "< 2 seconds",
            tickets_resolved: "65% without human",
            cost_savings: "$120K annually"
          },
          badges: ["Customer Favorite", "Cost Reducer"]
        },
        {
          id: 4,
          title: "Mobile Payment Solution",
          description: "Secure, fast payment processing for our e-commerce platforms",
          image: "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
          completion_date: "2023-09-05",
          category: "Fintech",
          team: ["Jack Morris", "Kim Lee", "Liam Wilson"],
          metrics: {
            transaction_speed: "0.8 seconds",
            adoption_rate: "87%",
            fraud_reduction: "63%"
          },
          badges: ["Security Champion", "Performance Leader"]
        },
        {
          id: 5,
          title: "Supply Chain Optimization",
          description: "AI-driven logistics planning that reduced delivery times",
          image: "https://images.unsplash.com/photo-1566843972426-f97148e217e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
          completion_date: "2023-11-17",
          category: "Logistics",
          team: ["Mike Ross", "Nina Patel", "Omar Jackson"],
          metrics: {
            delivery_improvement: "32% faster",
            inventory_accuracy: "99.8%",
            cost_reduction: "18%"
          },
          badges: ["Efficiency Award", "Business Impact"]
        }
      ];
      
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
    }
  }, [projects, isLoading]);

  const categories = ["All", "Analytics", "AI", "Automation", "Fintech", "Logistics"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Banner */}
      <AnimatedHeroBanner />
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
            Our Victory Wall
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Celebrating our team's completed projects and achievements. Each card represents countless hours of dedication, innovation, and collaboration.
          </p>
        </div>
        
        {/* Filter Bar */}
        <FilterBar 
          categories={categories} 
          activeFilter={filterValue} 
          onChange={handleFilterChange} 
        />
        
        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 dark:border-gray-100"></div>
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