"use client";

import { cn } from "@/lib/utils";

export function FilterBar({ categories = [], activeFilter = "all", onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category.toLowerCase())}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full transition-all",
            "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            activeFilter === category.toLowerCase()
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
} 