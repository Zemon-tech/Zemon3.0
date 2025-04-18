-- Fix infinite recursion in RLS policies for all tables
-- This script completely replaces all problematic policies with simpler versions

-- Clean up all existing policies that may have recursion issues
DROP POLICY IF EXISTS "Users can view their own AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can view messages in accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can add messages to accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view participants in accessible chats" ON public.ai_chat_participants;
DROP POLICY IF EXISTS "Users can view participants if the chat owner" ON public.ai_chat_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.ai_chat_participants;

-- 1. Simplified policies for ai_chats
-- Split into multiple non-recursive policies
CREATE POLICY "Users can view their own created chats"
ON public.ai_chats
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can view public chats"
ON public.ai_chats
FOR SELECT
TO authenticated
USING (privacy = 'public');

CREATE POLICY "Users can view team chats they are part of"
ON public.ai_chats
FOR SELECT
TO authenticated
USING (
  privacy = 'team' AND 
  EXISTS (
    SELECT 1 FROM public.ai_chat_participants 
    WHERE chat_id = id AND user_id = auth.uid()
  )
);

-- 2. Simplified policies for ai_messages
-- View messages in chats you created
CREATE POLICY "Users can view messages in chats they created"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND created_by = auth.uid()
  )
);

-- View messages in public chats
CREATE POLICY "Users can view messages in public chats"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND privacy = 'public'
  )
);

-- View messages in team chats you're part of
CREATE POLICY "Users can view messages in team chats they are part of"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats c
    JOIN public.ai_chat_participants p ON c.id = p.chat_id
    WHERE c.id = chat_id AND c.privacy = 'team' AND p.user_id = auth.uid()
  )
);

-- Add messages to chats you created
CREATE POLICY "Users can add messages to chats they created"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND created_by = auth.uid()
  )
);

-- Add messages to team chats you're part of
CREATE POLICY "Users can add messages to team chats they are part of"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  EXISTS (
    SELECT 1 FROM public.ai_chats c
    JOIN public.ai_chat_participants p ON c.id = p.chat_id
    WHERE c.id = chat_id AND c.privacy = 'team' AND p.user_id = auth.uid()
  )
);

-- 3. Simplified policies for ai_chat_participants
-- View participants in chats you created
CREATE POLICY "View participants in chats you created"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND created_by = auth.uid()
  )
);

-- View participants in public chats
CREATE POLICY "View participants in public chats"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND privacy = 'public'
  )
);

-- View your own participation in any chat
CREATE POLICY "View your own participation"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid()); 