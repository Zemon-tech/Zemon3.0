"use client";

import { format } from "date-fns";
import { Trophy } from "lucide-react";

export function ProjectCard({ project }) {
  // Format date nicely
  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Image */}
      <div className="relative h-48">
        <img
          src={project.image_url}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        
        {/* Achievement Type Badge */}
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1 text-sm font-medium bg-black/70 text-white rounded-full backdrop-blur-sm flex items-center space-x-1">
            <Trophy className="h-4 w-4" />
            <span>{project.is_team_achievement ? 'Team Achievement' : 'Individual Achievement'}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          {project.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {project.description}
        </p>
        
        {/* Date */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          Achieved on {formatDate(project.achievement_date)}
        </div>
      </div>
    </div>
  );
} 