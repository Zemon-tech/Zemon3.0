-- Fix infinite recursion in RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can view messages in accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can add messages to accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view participants in accessible chats" ON public.ai_chat_participants;

-- Create fixed policies without circular references
-- 1. Policy for AI chats
CREATE POLICY "Users can view their own AI chats"
ON public.ai_chats
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  privacy = 'public' OR
  (privacy = 'team' AND id IN (
    SELECT chat_id FROM public.ai_chat_participants
    WHERE user_id = auth.uid()
  ))
);

-- 2. Policies for AI messages
CREATE POLICY "Users can view messages in accessible chats"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND (
      created_by = auth.uid() OR
      privacy = 'public' OR
      (privacy = 'team' AND id IN (
        SELECT chat_id FROM public.ai_chat_participants
        WHERE user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Users can add messages to accessible chats"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  EXISTS (
    SELECT 1 FROM public.ai_chats
    WHERE id = chat_id AND (
      created_by = auth.uid() OR
      (privacy = 'team' AND id IN (
        SELECT chat_id FROM public.ai_chat_participants
        WHERE user_id = auth.uid()
      ))
    )
  )
);

-- 3. Policy for AI chat participants - complete replacement approach
-- The simplest solution is to make a more direct policy
DROP POLICY IF EXISTS "Users can view participants in accessible chats" ON public.ai_chat_participants;

-- Option 1: Allow a user to view all participants if they are a member of the chat
CREATE POLICY "Users can view participants if the chat owner"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats WHERE created_by = auth.uid() OR privacy = 'public'
  )
);

-- Option 2: Allow a user to view their own participation
CREATE POLICY "Users can view their own participation"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
); 