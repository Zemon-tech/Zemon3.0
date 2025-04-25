-- Migration: add_notifications_table
-- Description: Creates the notifications table and related functionality
-- Created at: 2025-04-22

-- =============================================
-- 1. Create notification types and severity enums
-- =============================================
CREATE TYPE notification_type AS ENUM (
  'system', 
  'message', 
  'task', 
  'event', 
  'resource'
);

CREATE TYPE notification_severity AS ENUM (
  'info', 
  'success', 
  'warning', 
  'error'
);

-- =============================================
-- 2. Create notifications table
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type notification_type NOT NULL DEFAULT 'system',
  severity notification_severity NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notifications IS 'Stores user notifications for the application';

-- =============================================
-- 3. Add RLS policies
-- =============================================
-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create notification policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team leaders and admins can create notifications for any user" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('team_leader', 'admin')
  )
);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- =============================================
-- 4. Create functions for notifications
-- =============================================
-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type notification_type DEFAULT 'system',
  p_severity notification_severity DEFAULT 'info',
  p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    severity,
    link
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_severity,
    p_link
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to mark a notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
  p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user ID of the notification
  SELECT user_id INTO v_user_id
  FROM public.notifications
  WHERE id = p_notification_id;
  
  -- Check if the current user is the owner of the notification
  IF v_user_id = auth.uid() THEN
    UPDATE public.notifications
    SET read = true
    WHERE id = p_notification_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET read = true
  WHERE user_id = auth.uid() AND read = false;
  
  RETURN true;
END;
$$;

-- =============================================
-- 5. Create triggers
-- =============================================
-- Create trigger for updated_at timestamps
CREATE TRIGGER handle_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create sample notifications trigger on resource creation
CREATE OR REPLACE FUNCTION public.notify_resource_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the creator
  PERFORM public.create_notification(
    NEW.uploaded_by,
    'Resource Created',
    'Your resource "' || NEW.title || '" has been successfully created.',
    'resource',
    'success',
    '/resources/' || NEW.id
  );
  
  -- Notify admins (in a real system, you might want to be more selective)
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    severity,
    link
  )
  SELECT 
    id,
    'New Resource Available',
    'A new resource "' || NEW.title || '" has been added by ' || (SELECT name FROM public.users WHERE id = NEW.uploaded_by),
    'resource',
    'info',
    '/resources/' || NEW.id
  FROM 
    public.users
  WHERE 
    role = 'admin' AND id != NEW.uploaded_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER resource_notification_trigger
  AFTER INSERT ON public.resources
  FOR EACH ROW EXECUTE PROCEDURE public.notify_resource_creation();

-- =============================================
-- 6. Add sample notifications
-- =============================================
-- Add sample notifications for all users (will be executed for existing users)
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  severity,
  link,
  read
)
SELECT 
  id,
  'Welcome to Team Management',
  'Thank you for joining our platform. Here you can manage tasks, resources, and collaborate with your team.',
  'system',
  'info',
  '/dashboard',
  false
FROM 
  public.users
WHERE 
  NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE user_id = users.id AND title = 'Welcome to Team Management'
  );

-- Add some unread notifications for testing
INSERT INTO public.notifications (
  user_id,
  title,
  message,
  type,
  severity,
  link,
  read
)
SELECT 
  id,
  'New Feature: Global Search',
  'You can now search across all content using the search bar in the header.',
  'system',
  'info',
  NULL,
  false
FROM 
  public.users
WHERE 
  NOT EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE user_id = users.id AND title = 'New Feature: Global Search'
  );

-- =============================================
-- 7. Create indexes for performance
-- =============================================
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX notifications_read_idx ON public.notifications (read);
CREATE INDEX notifications_type_idx ON public.notifications (type);
CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);

-- =============================================
-- 8. Add created_by column to notifications table
-- =============================================
ALTER TABLE public.notifications 
ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL; 