"use client";

import { useEffect, useState, useRef } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { Play, Pause, SkipForward, SkipBack, Music as MusicIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, previousTrack } = useMusic();
  const [isMobile, setIsMobile] = useState(false);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const textRef = useRef(null);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Check if text is overflowing and needs to scroll
  useEffect(() => {
    if (textRef.current) {
      setIsTextOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [currentTrack]);

  // If no track is loaded, don't render the player
  if (!currentTrack) return null;

  // Define source icon or text
  const sourceLabel = currentTrack.source === 'upload' ? 'Local' : 
                     currentTrack.source === 'soundcloud' ? 'SoundCloud' : 'YouTube';

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-full h-12 shadow-md overflow-hidden" style={{ width: isMobile ? '130px' : '300px' }}>
      {!isMobile && (
        <div className="h-12 w-12 flex-shrink-0 relative">
          {currentTrack.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={`${currentTrack.title} thumbnail`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <MusicIcon className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="absolute top-0 right-0 bg-gray-800/70 text-white text-xs px-1 py-0.5">
            {sourceLabel}
          </div>
        </div>
      )}
      
      {!isMobile && (
        <div className="mx-3 w-[150px] flex-shrink-0 overflow-hidden">
          <div 
            ref={textRef}
            className={cn(
              "text-sm font-semibold whitespace-nowrap dark:text-white",
              isTextOverflowing && "animate-marquee"
            )}
          >
            {currentTrack.title}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {currentTrack.artist}
          </p>
        </div>
      )}
      
      <div className={cn("flex items-center", isMobile ? "mx-2" : "mx-3")}>
        {!isMobile && (
          <button
            onClick={previousTrack}
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center dark:text-white mr-1"
          >
            <SkipBack size={16} />
          </button>
        )}
        
        <button
          onClick={togglePlay}
          className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-1"
        >
          {isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} className="ml-0.5" />
          )}
        </button>
        
        <button
          onClick={nextTrack}
          className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center dark:text-white"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          padding-right: 100%;
          animation: marquee 10s linear infinite;
        }
      `}</style>
    </div>
  );
} 