-- Migration: update_notification_functions
-- Description: Updates notification functions to support created_by column
-- Created at: 2025-04-22

-- =============================================
-- 1. Update create_notification function
-- =============================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type notification_type DEFAULT 'system',
  p_severity notification_severity DEFAULT 'info',
  p_link TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
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
    link,
    created_by
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_severity,
    p_link,
    p_created_by
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- =============================================
-- 2. Update notify_resource_creation function
-- =============================================
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
    '/resources/' || NEW.id,
    NULL
  );
  
  -- Notify admins (in a real system, you might want to be more selective)
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    severity,
    link,
    created_by
  )
  SELECT 
    id,
    'New Resource Available',
    'A new resource "' || NEW.title || '" has been added by ' || (SELECT name FROM public.users WHERE id = NEW.uploaded_by),
    'resource',
    'info',
    '/resources/' || NEW.id,
    NEW.uploaded_by
  FROM 
    public.users
  WHERE 
    role = 'admin' AND id != NEW.uploaded_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 