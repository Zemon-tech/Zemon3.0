-- Migration: fix_ai_chat_policies
-- Description: Fixes infinite recursion in AI chat RLS policies
-- Created at: 2025-04-20

-- First, drop all problematic policies
DROP POLICY IF EXISTS "Users can view their own AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can view messages in accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can add messages to accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view participants in accessible chats" ON public.ai_chat_participants;

-- Drop any potentially conflicting policies
DROP POLICY IF EXISTS "Users can view chats they created" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can view public chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can view team chats they are part of" ON public.ai_chats;

DROP POLICY IF EXISTS "Users can view messages in chats they created" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view messages in public chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view messages in team chats they are part of" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can add messages to chats they created" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can add messages to team chats they are part of" ON public.ai_messages;

DROP POLICY IF EXISTS "View participants in chats you created" ON public.ai_chat_participants;
DROP POLICY IF EXISTS "View participants in public chats" ON public.ai_chat_participants;
DROP POLICY IF EXISTS "View your own participation" ON public.ai_chat_participants;

-- Create new policies without circular references

-- 1. Split policies for ai_chats
CREATE POLICY "Users can view chats they created"
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
  id IN (
    SELECT chat_id FROM public.ai_chat_participants 
    WHERE user_id = auth.uid()
  )
);

-- 2. Split policies for ai_messages
CREATE POLICY "Users can view messages in chats they created"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can view messages in public chats"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE privacy = 'public'
  )
);

CREATE POLICY "Users can view messages in team chats they are part of"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id FROM public.ai_chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add messages to chats they created"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can add messages to team chats they are part of"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  chat_id IN (
    SELECT chat_id FROM public.ai_chat_participants
    WHERE user_id = auth.uid()
  )
);

-- 3. Split policies for ai_chat_participants
CREATE POLICY "View participants in chats you created"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "View participants in public chats"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE privacy = 'public'
  )
);

CREATE POLICY "View your own participation"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid()); 