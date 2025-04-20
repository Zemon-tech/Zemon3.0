"use client";

import { useEffect, useState, useRef } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music as MusicIcon,
  Volume2,
  Heart,
  ListMusic
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MusicPlayer() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, previousTrack } = useMusic();
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Compact player for navbar
  const renderCompactPlayer = () => (
    <div 
      className="flex items-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all"
      style={{ width: isMobile ? '90px' : '220px', height: '40px' }}
      onClick={() => !isMobile && setIsExpanded(true)}
    >
      {!isMobile && (
        <div className="flex-shrink-0" style={{ width: '40px', height: '40px' }}>
          {currentTrack.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={`${currentTrack.title} thumbnail`}
              className="h-full w-full object-cover rounded-l-xl"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-l-xl">
              <MusicIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          )}
        </div>
      )}
      
      {!isMobile && (
        <div className="mx-2 flex-1 min-w-0 overflow-hidden">
          <div 
            ref={textRef}
            className={cn(
              "text-xs font-medium whitespace-nowrap text-gray-800 dark:text-white leading-tight",
              isTextOverflowing && "animate-marquee"
            )}
          >
            {currentTrack.title}
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
            {currentTrack.artist}
          </p>
        </div>
      )}
      
      <div className="flex items-center px-1.5 ml-auto">
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="h-6 w-6 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={12} />
          ) : (
            <Play size={12} className="ml-0.5" />
          )}
        </button>
        
        {!isMobile && (
          <button
            onClick={(e) => { e.stopPropagation(); nextTrack(); }}
            className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-1"
            aria-label="Next track"
          >
            <SkipForward size={12} />
          </button>
        )}
      </div>
    </div>
  );

  // Expanded player modal
  const renderExpandedPlayer = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsExpanded(false)}>
      <div 
        className="relative rounded-2xl p-8 max-w-md w-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={() => setIsExpanded(false)}>
          ✕
        </div>
        
        {/* Album art */}
        <div className="w-full aspect-square mb-6 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
          {currentTrack.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={`${currentTrack.title} thumbnail`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <MusicIcon className="h-24 w-24 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        
        {/* Track info */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentTrack.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {currentTrack.artist}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="mb-8">
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-black to-gray-800 dark:from-white dark:to-gray-300" 
              style={{ width: '30%' }} 
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>0:30</span>
            <span>3:45</span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex justify-center items-center mb-8">
          <button className="mx-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <Heart size={22} />
          </button>
          
          <button 
            onClick={previousTrack} 
            className="mx-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-transform hover:scale-110"
          >
            <SkipBack size={28} />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="h-16 w-16 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black mx-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:scale-105 shadow-lg"
          >
            {isPlaying ? (
              <Pause size={32} />
            ) : (
              <Play size={32} className="ml-1" />
            )}
          </button>
          
          <button 
            onClick={nextTrack} 
            className="mx-4 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-transform hover:scale-110"
          >
            <SkipForward size={28} />
          </button>
          
          <button className="mx-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <ListMusic size={22} />
          </button>
        </div>
        
        {/* Volume */}
        <div className="flex items-center">
          <Volume2 size={18} className="mr-3 text-gray-500 dark:text-gray-400" />
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400" 
              style={{ width: '70%' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderCompactPlayer()}
      {isExpanded && renderExpandedPlayer()}

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
    </>
  );
} 