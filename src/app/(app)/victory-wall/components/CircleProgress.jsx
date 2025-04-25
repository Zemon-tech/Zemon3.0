"use client";

import { useEffect, useState } from "react";

export function CircleProgress({ percentage = 75, label = "Success", size = 60, thickness = 4 }) {
  const [progress, setProgress] = useState(0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Animate the progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [percentage]);
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle with animation */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-blue-500 dark:text-blue-400 transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {progress}%
        </span>
        <span className="text-[9px] text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
    </div>
  );
} 