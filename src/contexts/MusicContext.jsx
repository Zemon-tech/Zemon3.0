"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { musicController } from "@/lib/musicController";
import { supabase } from "@/lib/supabase";

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load music library on mount
  useEffect(() => {
    const loadMusicLibrary = async () => {
      if (!supabase || !supabase.isInitialized?.()) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('music_library')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setPlaylist(data || []);
        musicController.setPlaylist(data || []);
      } catch (error) {
        console.error('Error loading music library:', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadMusicLibrary();

    // Set up music controller event listeners
    musicController.onTrackChange((track) => {
      setCurrentTrack(track);
    });

    musicController.onPlay(() => {
      setIsPlaying(true);
    });

    musicController.onPause(() => {
      setIsPlaying(false);
    });

    // Clean up on unmount
    return () => {
      // Remove event listeners if needed
    };
  }, []);

  // Play a track by ID
  const playTrack = (id) => {
    musicController.loadTrackById(id);
    musicController.play();
  };

  // Toggle play/pause
  const togglePlay = () => {
    musicController.togglePlay();
  };

  // Skip to next track
  const nextTrack = () => {
    musicController.next();
  };

  // Go to previous track
  const previousTrack = () => {
    musicController.previous();
  };

  // Add a new track to the library
  const addTrack = async (trackData) => {
    if (!supabase || !supabase.isInitialized?.()) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('music_library')
        .insert(trackData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add track to local playlist
      setPlaylist((prev) => [data, ...prev]);
      musicController.addTrack(data);
      
      return data;
    } catch (error) {
      console.error('Error adding track:', error.message);
      return null;
    }
  };

  // Delete a track from the library
  const deleteTrack = async (id) => {
    if (!supabase || !supabase.isInitialized?.()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('music_library')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Remove track from local playlist
      setPlaylist((prev) => prev.filter(track => track.id !== id));
      
      // If the current track is deleted, stop playback
      if (currentTrack && currentTrack.id === id) {
        musicController.stop();
        setCurrentTrack(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting track:', error.message);
      return false;
    }
  };

  // Search tracks in the library
  const searchTracks = (query) => {
    if (!query) return playlist;
    
    const lowercaseQuery = query.toLowerCase();
    return playlist.filter(track => 
      track.title.toLowerCase().includes(lowercaseQuery) || 
      track.artist.toLowerCase().includes(lowercaseQuery)
    );
  };

  return (
    <MusicContext.Provider 
      value={{
        currentTrack,
        isPlaying,
        playlist,
        loading,
        playTrack,
        togglePlay,
        nextTrack,
        previousTrack,
        addTrack,
        deleteTrack,
        searchTracks
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export const useMusic = () => useContext(MusicContext); 