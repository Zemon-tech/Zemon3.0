-- Migration: create_music_library_schema
-- Description: Creates the music library table and storage bucket
-- Created at: 2025-04-15

-- Create music_library table
CREATE TABLE public.music_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('upload', 'soundcloud', 'youtube')),
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.music_library IS 'Stores music tracks from uploads, SoundCloud, and YouTube';

-- Create storage bucket for music uploads if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'music-uploads') THEN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('music-uploads', 'music-uploads', true);
  END IF;
END $$;

-- CORS configuration is handled differently depending on Supabase version
-- Newer versions might use storage.buckets.cors or storage.buckets.cors_origins
-- We'll skip this in the migration and configure it through the dashboard if needed

-- Enable Row Level Security
ALTER TABLE public.music_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for music_library table
CREATE POLICY "Users can view all music library entries" 
ON public.music_library 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create their own music entries" 
ON public.music_library 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music entries" 
ON public.music_library 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music entries" 
ON public.music_library 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create storage policies for music uploads (will not error if policies already exist)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can read all music uploads"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'music-uploads');
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    CREATE POLICY "Users can upload their own music"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'music-uploads' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    CREATE POLICY "Users can update their own music uploads"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'music-uploads' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;

  BEGIN
    CREATE POLICY "Users can delete their own music uploads"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'music-uploads' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;

-- Create trigger for updated_at timestamps
CREATE TRIGGER handle_music_library_updated_at
  BEFORE UPDATE ON public.music_library
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes
CREATE INDEX music_library_user_id_idx ON public.music_library (user_id);
CREATE INDEX music_library_source_idx ON public.music_library (source); 