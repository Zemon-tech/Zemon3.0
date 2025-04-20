"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMusic } from "@/contexts/MusicContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { 
  Play, 
  Pause,
  Trash2, 
  Music, 
  Search, 
  Upload, 
  FileAudio, 
  Disc3,
  Youtube,
  Plus
} from "lucide-react";

export default function MusicPage() {
  const { user } = useAuth();
  const { 
    playlist, 
    loading, 
    playTrack, 
    addTrack, 
    deleteTrack,
    searchTracks,
    currentTrack,
    isPlaying,
    togglePlay
  } = useMusic();

  const [activeTab, setActiveTab] = useState("upload");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [soundCloudUrl, setSoundCloudUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTracks, setFilteredTracks] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Update filtered tracks when search query or playlist changes
  useEffect(() => {
    setFilteredTracks(searchTracks(searchQuery));
  }, [searchQuery, playlist, searchTracks]);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadFileName(file.name);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      setUploadFileName(file.name);
    }
  };

  // Upload track to Supabase Storage
  const handleUpload = async () => {
    if (!uploadFile || !user) return;

    try {
      setIsUploading(true);
      setErrorMessage("");

      // Extract file extension and generate unique filename
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('music-uploads')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music-uploads')
        .getPublicUrl(filePath);

      // Extract title and artist from filename (assuming format: Artist - Title.mp3)
      let title = uploadFile.name.replace(`.${fileExt}`, '');
      let artist = 'Unknown Artist';

      const splitName = title.split(' - ');
      if (splitName.length > 1) {
        artist = splitName[0].trim();
        title = splitName[1].trim();
      }

      // Save to database
      await addTrack({
        user_id: user.id,
        title,
        artist,
        source: 'upload',
        url: publicUrl,
        thumbnail: null, // Could add default artwork here
        duration: null // Could extract duration with more complex code
      });

      // Reset form
      setUploadFile(null);
      setUploadFileName("");
      setShowUpload(false);
    } catch (error) {
      console.error('Error uploading file:', error.message);
      setErrorMessage("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle SoundCloud embed
  const handleSoundCloudEmbed = async () => {
    if (!soundCloudUrl || !user) return;

    try {
      setIsEmbedding(true);
      setErrorMessage("");

      // Fetch oEmbed data from SoundCloud
      const response = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(soundCloudUrl)}&format=json`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch SoundCloud data");
      }
      
      const data = await response.json();
      
      // Extract title and author from oEmbed response
      const title = data.title || "Unknown Track";
      const artist = data.author_name || "Unknown Artist";
      const thumbnail = data.thumbnail_url;
      
      // Save to database
      await addTrack({
        user_id: user.id,
        title,
        artist,
        source: 'soundcloud',
        url: soundCloudUrl,
        thumbnail,
        duration: null
      });

      // Reset form
      setSoundCloudUrl("");
      setShowUpload(false);
    } catch (error) {
      console.error('Error embedding SoundCloud track:', error.message);
      setErrorMessage("Failed to embed SoundCloud track. Please check URL and try again.");
    } finally {
      setIsEmbedding(false);
    }
  };

  // Handle YouTube embed
  const handleYouTubeEmbed = async () => {
    if (!youtubeUrl || !user) return;

    try {
      setIsEmbedding(true);
      setErrorMessage("");

      // Extract video ID from YouTube URL
      const videoIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
      if (!videoIdMatch) {
        throw new Error("Invalid YouTube URL");
      }
      
      const videoId = videoIdMatch[1];
      
      // Fetch video info using oEmbed API
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch YouTube data");
      }
      
      const data = await response.json();
      
      // Extract title and default to Unknown for artist
      const title = data.title || "Unknown Track";
      const artist = "YouTube Music"; // YouTube oEmbed doesn't provide channel name in a clean way
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      
      // Save to database
      await addTrack({
        user_id: user.id,
        title,
        artist,
        source: 'youtube',
        url: videoId, // Store just the ID for YouTube
        thumbnail,
        duration: null
      });

      // Reset form
      setYoutubeUrl("");
      setShowUpload(false);
    } catch (error) {
      console.error('Error embedding YouTube track:', error.message);
      setErrorMessage("Failed to embed YouTube track. Please check URL and try again.");
    } finally {
      setIsEmbedding(false);
    }
  };

  // Handle track deletion
  const handleDeleteTrack = async (id) => {
    if (confirm("Are you sure you want to delete this track?")) {
      await deleteTrack(id);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Your Music Library</h1>
        <p className="text-gray-600 dark:text-gray-400">Listen to and manage your collection</p>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <Input
              type="text"
              placeholder="Search by title or artist"
              className="pl-10 pr-4 py-6 h-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Add Music Button - Toggle Upload Form */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
          <Music className="mr-2" /> 
          Your Tracks
          <span className="ml-2 text-sm bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
            {filteredTracks.length}
          </span>
        </h2>
        
        <Button 
          onClick={() => setShowUpload(!showUpload)} 
          className="flex items-center bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {showUpload ? "Hide Upload" : "Add Music"}
          {!showUpload && <Plus className="ml-1" size={16} />}
        </Button>
      </div>
      
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-6 max-w-md mx-auto">
          {errorMessage}
        </div>
      )}
      
      {/* Upload Section - Collapsible */}
      {showUpload && (
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden mb-4">
              <TabsTrigger 
                value="upload" 
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <FileAudio size={16} className="mr-2" />
                File
              </TabsTrigger>
              <TabsTrigger 
                value="soundcloud"
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <Disc3 size={16} className="mr-2" />
                SoundCloud
              </TabsTrigger>
              <TabsTrigger 
                value="youtube"
                className="py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <Youtube size={16} className="mr-2" />
                YouTube
              </TabsTrigger>
            </TabsList>
            
            <div>
              {/* Upload Tab */}
              <TabsContent value="upload">
                <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                  <div 
                    className={`flex flex-col items-center justify-center border border-dashed rounded-lg p-5 transition-colors ${
                      dragActive 
                        ? 'border-black bg-black/5 dark:border-white dark:bg-white/5' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="w-full flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        dragActive 
                          ? 'bg-black/10 dark:bg-white/10' 
                          : 'bg-gray-100 dark:bg-gray-700/50'
                      }`}>
                        <Upload
                          size={24}
                          className={`${
                            dragActive 
                              ? 'text-black dark:text-white' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        />
                      </div>
                      
                      <p className="text-sm font-medium mb-1 text-center">
                        Drag & drop audio file here
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
                        MP3, WAV, or M4A up to 20MB
                      </p>
                      
                      <div className="w-full flex justify-center mb-2">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer text-sm px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                        >
                          Browse Files
                        </label>
                      </div>
                    </div>
                    
                    {uploadFileName && (
                      <div className="w-full mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center mb-2">
                          <FileAudio size={16} className="text-gray-500 mr-2" />
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                            {uploadFileName}
                          </p>
                        </div>
                        <Button 
                          onClick={handleUpload} 
                          disabled={!uploadFile || isUploading}
                          className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                        >
                          {isUploading ? (
                            <span className="flex items-center">
                              <span className="w-4 h-4 mr-2 border-2 border-t-transparent border-white dark:border-black rounded-full animate-spin"></span>
                              Uploading...
                            </span>
                          ) : "Upload Track"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              {/* SoundCloud Tab */}
              <TabsContent value="soundcloud">
                <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <Disc3 size={24} className="text-orange-500" />
                      </div>
                    </div>
                    
                    <h3 className="text-base font-medium text-center mb-1">
                      Add from SoundCloud
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                      Paste a SoundCloud URL to add to your collection
                    </p>
                    
                    <div className="relative mb-3">
                      <Input
                        type="url"
                        placeholder="https://soundcloud.com/artist/track"
                        value={soundCloudUrl}
                        onChange={(e) => setSoundCloudUrl(e.target.value)}
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Disc3 size={16} className="text-gray-400" />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSoundCloudEmbed} 
                      disabled={!soundCloudUrl || isEmbedding}
                      className="bg-orange-500 text-white hover:bg-orange-600 dark:hover:bg-orange-400 transition-colors"
                    >
                      {isEmbedding ? (
                        <span className="flex items-center">
                          <span className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                          Embedding...
                        </span>
                      ) : "Add Track"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>
              
              {/* YouTube Tab */}
              <TabsContent value="youtube">
                <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <Youtube size={24} className="text-red-500" />
                      </div>
                    </div>
                    
                    <h3 className="text-base font-medium text-center mb-1">
                      Add from YouTube
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
                      Paste a YouTube URL to add to your collection
                    </p>
                    
                    <div className="relative mb-3">
                      <Input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Youtube size={16} className="text-gray-400" />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleYouTubeEmbed} 
                      disabled={!youtubeUrl || isEmbedding}
                      className="bg-red-500 text-white hover:bg-red-600 dark:hover:bg-red-400 transition-colors"
                    >
                      {isEmbedding ? (
                        <span className="flex items-center">
                          <span className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                          Embedding...
                        </span>
                      ) : "Add Track"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
      
      {/* Music Library Display */}
      <div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent border-black dark:border-white animate-spin"></div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <Music className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              {searchQuery 
                ? "No tracks match your search" 
                : "Your music collection is empty"}
            </p>
            <p className="text-gray-500 dark:text-gray-500 mb-4 max-w-md mx-auto">
              {searchQuery 
                ? "Try a different search term or clear your search" 
                : "Click 'Add Music' to start building your collection"}
            </p>
            {searchQuery ? (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="border-gray-300 dark:border-gray-700"
              >
                Clear Search
              </Button>
            ) : (
              <Button 
                onClick={() => setShowUpload(true)}
                className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                Add Music
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTracks.map((track) => {
              const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
              
              return (
                <Card 
                  key={track.id} 
                  className="overflow-hidden flex flex-col group hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <div className="h-40 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {track.thumbnail ? (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                        <Music className="h-14 w-14 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    
                    {/* Play button overlay */}
                    <button 
                      onClick={() => playTrack(track.id)}
                      className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md">
                        {isCurrentlyPlaying ? (
                          <Pause className="h-5 w-5 text-white dark:text-black" />
                        ) : (
                          <Play className="h-5 w-5 text-white dark:text-black ml-0.5" />
                        )}
                      </div>
                    </button>
                    
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md">
                      {track.source === 'upload' ? 'Local' : 
                       track.source === 'soundcloud' ? 'SoundCloud' : 'YouTube'}
                    </div>
                  </div>
                  
                  <div className="p-3 flex-grow flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-base line-clamp-1" title={track.title}>
                          {track.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1" title={track.artist}>
                          {track.artist}
                        </p>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 rounded-full ml-2 flex-shrink-0"
                        onClick={() => handleDeleteTrack(track.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 