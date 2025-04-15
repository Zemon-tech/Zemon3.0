-- Migration: update_user_names
-- Description: Updates user names to use a proper format instead of email addresses
-- Created at: 2025-04-14

-- Update users who have null or empty names
UPDATE public.users
SET name = split_part(email, '@', 1)
WHERE name IS NULL OR trim(name) = '';

-- Update users whose name is exactly the same as their email
UPDATE public.users
SET name = split_part(email, '@', 1)
WHERE name = email;

-- Check if auth.users has metadata with full_name and update public.users accordingly
UPDATE public.users u
SET name = m.full_name
FROM (
  SELECT id, raw_user_meta_data->>'full_name' as full_name 
  FROM auth.users
  WHERE raw_user_meta_data->>'full_name' IS NOT NULL
) m
WHERE u.id = m.id AND m.full_name IS NOT NULL AND m.full_name != '';

-- Update the trigger function to use better name handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment reminding about the name handling logic
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user entry in public.users table when a new auth.users entry is created, using full_name from metadata if available'; 