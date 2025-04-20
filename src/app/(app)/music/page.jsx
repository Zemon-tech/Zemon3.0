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
import { Play, Trash2, Music, Search } from "lucide-react";

export default function MusicPage() {
  const { user } = useAuth();
  const { 
    playlist, 
    loading, 
    playTrack, 
    addTrack, 
    deleteTrack,
    searchTracks
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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">🎵 Music Library</h1>
      
      {/* Tabs for Upload, SoundCloud, YouTube */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="soundcloud">SoundCloud</TabsTrigger>
          <TabsTrigger value="youtube">YouTube Music</TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col space-y-4">
              <label className="block text-sm font-medium mb-1">
                Select Audio File
              </label>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="mb-2"
              />
              {uploadFileName && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {uploadFileName}
                </p>
              )}
              <Button 
                onClick={handleUpload} 
                disabled={!uploadFile || isUploading}
                className="mt-2"
              >
                {isUploading ? "Uploading..." : "Upload Track"}
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        {/* SoundCloud Tab */}
        <TabsContent value="soundcloud" className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col space-y-4">
              <label className="block text-sm font-medium mb-1">
                SoundCloud Track URL
              </label>
              <Input
                type="url"
                placeholder="https://soundcloud.com/artist/track"
                value={soundCloudUrl}
                onChange={(e) => setSoundCloudUrl(e.target.value)}
              />
              <Button 
                onClick={handleSoundCloudEmbed} 
                disabled={!soundCloudUrl || isEmbedding}
                className="mt-2"
              >
                {isEmbedding ? "Embedding..." : "Embed Track"}
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        {/* YouTube Tab */}
        <TabsContent value="youtube" className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-col space-y-4">
              <label className="block text-sm font-medium mb-1">
                YouTube Music URL
              </label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
              <Button 
                onClick={handleYouTubeEmbed} 
                disabled={!youtubeUrl || isEmbedding}
                className="mt-2"
              >
                {isEmbedding ? "Embedding..." : "Embed Track"}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-6">
          {errorMessage}
        </div>
      )}
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          type="text"
          placeholder="Search by title or artist"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Music Library Display */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Music Library</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Music className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery 
                ? "No tracks match your search" 
                : "Your music library is empty. Add tracks using the options above."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTracks.map((track) => (
              <Card key={track.id} className="overflow-hidden flex flex-col">
                <div className="h-40 bg-gray-200 dark:bg-gray-800 relative">
                  {track.thumbnail ? (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                      <Music className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded-full">
                    {track.source === 'upload' ? 'Local' : 
                     track.source === 'soundcloud' ? 'SoundCloud' : 'YouTube'}
                  </div>
                </div>
                <div className="p-4 flex-grow">
                  <h3 className="font-semibold text-lg truncate" title={track.title}>
                    {track.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm truncate" title={track.artist}>
                    {track.artist}
                  </p>
                </div>
                <div className="p-4 pt-0 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => playTrack(track.id)}>
                    <Play size={16} className="mr-2" />
                    Play
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => handleDeleteTrack(track.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 