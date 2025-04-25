"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CircleProgress } from "./CircleProgress";

export function ProjectCard({ project }) {
  const [isHovered, setIsHovered] = useState(false);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  
  // Handle mouse move for 3D effect
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (normalized -1 to 1)
    const x = ((e.clientX - centerX) / (rect.width / 2)) * 10; // Max 10 degree tilt
    const y = ((e.clientY - centerY) / (rect.height / 2)) * 10;
    
    // Update pointer position for highlight effect
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    setPointerPosition({ x: relativeX, y: relativeY });
    
    // Apply transform
    cardRef.current.style.transform = `
      perspective(1000px) 
      rotateX(${-y}deg) 
      rotateY(${x}deg) 
      translateZ(10px)
    `;
  };
  
  // Reset transform on mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = `
        perspective(1000px) 
        rotateX(0deg) 
        rotateY(0deg) 
        translateZ(0px)
      `;
    }
  };
  
  // Format date nicely
  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  // Generate random metric for circle progress
  const getRandomMetric = () => {
    const metrics = Object.values(project.metrics);
    if (!metrics.length) return { value: 85, label: "Success" };
    
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    // Try to extract a percentage if possible
    const percentageMatch = String(randomMetric).match(/(\d+)%/);
    if (percentageMatch) {
      return { 
        value: Math.min(parseInt(percentageMatch[1], 10), 100), 
        label: Object.keys(project.metrics).find(key => project.metrics[key] === randomMetric) || "Metric"
      };
    }
    
    // Return a random percentage between 75-95 if we can't extract one
    return { 
      value: Math.floor(Math.random() * 20) + 75,
      label: Object.keys(project.metrics).find(key => project.metrics[key] === randomMetric) || "Success"
    };
  };
  
  const randomMetric = getRandomMetric();
  
  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg transition-all duration-300",
        isHovered ? "shadow-xl scale-[1.02]" : "hover:shadow-xl hover:scale-[1.01]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: "perspective(1000px)", transformStyle: "preserve-3d" }}
    >
      {/* Highlight Effect */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 bg-gradient-radial from-white/30 via-transparent to-transparent transition-opacity duration-300",
          isHovered ? "opacity-100" : ""
        )}
        style={{ 
          background: isHovered ? `radial-gradient(circle at ${pointerPosition.x * 100}% ${pointerPosition.y * 100}%, rgba(255, 255, 255, 0.15), transparent 50%)` : '',
        }}
      />
      
      {/* Image */}
      <div className="h-48 overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 scale-100 group-hover:scale-110"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-2 max-w-[70%]">
          {project.badges?.map((badge, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded-full backdrop-blur-sm"
              style={{ 
                transform: `translateZ(${20 + index * 5}px)`,
                transition: 'transform 0.3s ease',
              }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5" style={{ transform: "translateZ(20px)" }}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {project.title}
          </h3>
          
          {/* Circle Progress */}
          <div className="ml-2" style={{ transform: "translateZ(30px)" }}>
            <CircleProgress 
              percentage={randomMetric.value} 
              label={randomMetric.label}
              size={52}
            />
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {project.description}
        </p>
        
        {/* Team */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Team
          </h4>
          <div className="flex flex-wrap gap-1">
            {project.team?.map((member, index) => (
              <span 
                key={index} 
                className="inline-block px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {member}
              </span>
            ))}
          </div>
        </div>
        
        {/* Metrics */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(project.metrics || {}).map(([key, value], index) => (
              <div 
                key={index} 
                className="flex flex-col"
                style={{ 
                  transform: `translateZ(${25 + index * 2}px)`,
                }}
              >
                <span className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Date */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          Completed on {formatDate(project.completion_date)}
        </div>
      </div>
      
      {/* Bottom Shine Effect */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 transition-opacity duration-300",
          isHovered ? "opacity-100" : ""
        )}
      />
    </div>
  );
} 