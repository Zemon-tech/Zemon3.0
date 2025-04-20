import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { source, url } = await request.json();
    
    if (!source || !url) {
      return NextResponse.json(
        { error: 'Source and URL are required' },
        { status: 400 }
      );
    }
    
    if (!['soundcloud', 'youtube'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source. Must be "soundcloud" or "youtube"' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Process based on source
    if (source === 'soundcloud') {
      return await handleSoundCloudEmbed(url, userId, supabase);
    } else if (source === 'youtube') {
      return await handleYouTubeEmbed(url, userId, supabase);
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle SoundCloud embed process
async function handleSoundCloudEmbed(url, userId, supabase) {
  try {
    // Fetch oEmbed data from SoundCloud
    const response = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch SoundCloud data' },
        { status: 400 }
      );
    }
    
    const data = await response.json();
    
    // Extract metadata
    const title = data.title || 'Unknown Track';
    const artist = data.author_name || 'Unknown Artist';
    const thumbnail = data.thumbnail_url;
    
    // Insert record in database
    const { data: trackData, error } = await supabase
      .from('music_library')
      .insert({
        user_id: userId,
        title,
        artist,
        source: 'soundcloud',
        url,
        thumbnail,
        duration: null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save track data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      track: trackData
    });
    
  } catch (error) {
    console.error('SoundCloud embed error:', error);
    return NextResponse.json(
      { error: 'Failed to process SoundCloud URL' },
      { status: 500 }
    );
  }
}

// Handle YouTube embed process
async function handleYouTubeEmbed(url, userId, supabase) {
  try {
    // Extract video ID from YouTube URL
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&]+)/);
    if (!videoIdMatch) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }
    
    const videoId = videoIdMatch[1];
    
    // Fetch video info using oEmbed API
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch YouTube data' },
        { status: 400 }
      );
    }
    
    const data = await response.json();
    
    // Extract metadata
    const title = data.title || 'Unknown Track';
    const artist = 'YouTube Music'; // YouTube oEmbed doesn't provide channel name in a clean way
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    // Insert record in database
    const { data: trackData, error } = await supabase
      .from('music_library')
      .insert({
        user_id: userId,
        title,
        artist,
        source: 'youtube',
        url: videoId, // Store just the ID for YouTube
        thumbnail,
        duration: null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save track data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      track: trackData
    });
    
  } catch (error) {
    console.error('YouTube embed error:', error);
    return NextResponse.json(
      { error: 'Failed to process YouTube URL' },
      { status: 500 }
    );
  }
} 