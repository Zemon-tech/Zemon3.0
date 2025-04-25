"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { globalSearch, formatSearchResults } from "@/lib/globalSearch";
import { dynamicIconImport } from "@/lib/utils";

export function SearchModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Perform search
  const performSearch = async (query) => {
    setIsLoading(true);
    try {
      const searchResults = await globalSearch(query);
      setResults(formatSearchResults(searchResults));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    if (result.url) {
      router.push(result.url);
      onClose();
    }
  };

  // Dynamically load Lucide icons
  const IconComponent = ({ iconName }) => {
    const [Icon, setIcon] = useState(null);

    useEffect(() => {
      const loadIcon = async () => {
        try {
          const icon = await dynamicIconImport(iconName);
          setIcon(icon);
        } catch (error) {
          console.error(`Failed to load icon: ${iconName}`, error);
          setIcon(null);
        }
      };

      if (iconName) {
        loadIcon();
      }
    }, [iconName]);

    if (!Icon) return <Search className="h-4 w-4 text-gray-500" />;
    return <Icon className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="border-b">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Search documentation, tools, tutorials..."
              className="border-0 rounded-none pl-12 py-6 h-14 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-3.5 h-5 w-5 animate-spin text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-0">
          {results.length === 0 && searchQuery !== "" && !isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              No results found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            <ul className="divide-y">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  className={`p-4 cursor-pointer ${
                    index === selectedIndex
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      <IconComponent iconName={result.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.snippet || "No preview available"}
                      </p>
                    </div>
                    <div className="ml-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {result.type}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 