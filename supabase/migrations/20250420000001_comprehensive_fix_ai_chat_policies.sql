-- Migration: comprehensive_fix_ai_chat_policies
-- Description: Completely removes and recreates all AI chat policies to fix infinite recursion
-- Created at: 2025-04-20

-- Disable RLS temporarily to ensure we can see all policies
ALTER TABLE public.ai_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_participants DISABLE ROW LEVEL SECURITY;

-- Query to list all policies for debugging
-- SELECT * FROM pg_policies WHERE tablename IN ('ai_chats', 'ai_messages', 'ai_chat_participants');

-- Drop ALL existing policies for these tables
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies 
            WHERE tablename IN ('ai_chats', 'ai_messages', 'ai_chat_participants')) 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Create simplified policies with absolutely no circular references
-- Each policy uses the simplest possible conditions

-- 1. Policies for ai_chats with no recursion
CREATE POLICY "view_own_chats" 
ON public.ai_chats
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "view_public_chats" 
ON public.ai_chats
FOR SELECT
TO authenticated
USING (privacy = 'public');

CREATE POLICY "view_participant_chats" 
ON public.ai_chats
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT chat_id FROM public.ai_chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "create_own_chats"
ON public.ai_chats
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "update_own_chats"
ON public.ai_chats
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "delete_own_chats"
ON public.ai_chats
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 2. Policies for ai_messages with no recursion
CREATE POLICY "view_own_chat_messages" 
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "view_public_chat_messages" 
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE privacy = 'public'
  )
);

CREATE POLICY "view_participant_chat_messages" 
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id FROM public.ai_chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "insert_own_chat_messages"
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

CREATE POLICY "insert_participant_chat_messages"
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

CREATE POLICY "update_own_messages"
ON public.ai_messages
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "delete_own_messages"
ON public.ai_messages
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3. Policies for ai_chat_participants with no recursion
CREATE POLICY "view_own_chat_participants" 
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "view_public_chat_participants" 
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE privacy = 'public'
  )
);

CREATE POLICY "view_own_participation" 
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "insert_participants_as_owner"
ON public.ai_chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "update_participants_as_owner"
ON public.ai_chat_participants
FOR UPDATE
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "delete_participants_as_owner"
ON public.ai_chat_participants
FOR DELETE
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats
    WHERE created_by = auth.uid()
  )
);

-- Re-enable RLS
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_participants ENABLE ROW LEVEL SECURITY; 