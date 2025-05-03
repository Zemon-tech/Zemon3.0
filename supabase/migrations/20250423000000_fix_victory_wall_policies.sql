-- Migration: fix_victory_wall_policies
-- Description: Fix RLS policies for the victory_wall table to ensure admins can create achievements
-- Created at: 2025-04-23

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view all victory wall entries" ON public.victory_wall;
DROP POLICY IF EXISTS "Users can create their own achievements" ON public.victory_wall;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.victory_wall;
DROP POLICY IF EXISTS "Team leaders and admins can manage any achievement" ON public.victory_wall;

-- Create new policies
-- Everyone can view achievements
CREATE POLICY "Users can view all achievements"
ON public.victory_wall
FOR SELECT
TO authenticated
USING (true);

-- Only admins can create achievements
CREATE POLICY "Admins can create achievements"
ON public.victory_wall
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role = 'admin'
  )
);

-- Only admins can update achievements
CREATE POLICY "Admins can update achievements"
ON public.victory_wall
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role = 'admin'
  )
);

-- Only admins can delete achievements
CREATE POLICY "Admins can delete achievements"
ON public.victory_wall
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users
    WHERE role = 'admin'
  )
); 