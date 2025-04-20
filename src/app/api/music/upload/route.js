import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Get form data with file
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
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
    
    // Generate filename and path
    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('music-uploads')
      .upload(filePath, file);
    
    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('music-uploads')
      .getPublicUrl(filePath);
    
    // Extract metadata from filename
    let title = file.name.replace(`.${file.name.split('.').pop()}`, '');
    let artist = 'Unknown Artist';
    
    const splitName = title.split(' - ');
    if (splitName.length > 1) {
      artist = splitName[0].trim();
      title = splitName[1].trim();
    }
    
    // Insert record in database
    const { data: trackData, error: dbError } = await supabase
      .from('music_library')
      .insert({
        user_id: userId,
        title,
        artist,
        source: 'upload',
        url: publicUrl,
        thumbnail: null,
        duration: null
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database insert error:', dbError);
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
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 