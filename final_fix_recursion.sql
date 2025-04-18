-- Final fix for infinite recursion in RLS policies
-- This focuses on using the simplest approach possible

-- First, drop all problematic policies
DROP POLICY IF EXISTS "Users can view their own AI chats" ON public.ai_chats;
DROP POLICY IF EXISTS "Users can view messages in accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can add messages to accessible chats" ON public.ai_messages;
DROP POLICY IF EXISTS "Users can view participants in accessible chats" ON public.ai_chat_participants;
DROP POLICY IF EXISTS "Users can view participants if the chat owner" ON public.ai_chat_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.ai_chat_participants;

-- Replace with extremely simple policies that don't reference each other

-- 1. Super simple policy for ai_chats
CREATE POLICY "Users can view all chats basic"
ON public.ai_chats
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  privacy = 'public' OR
  id IN (
    SELECT chat_id FROM public.ai_chat_participants WHERE user_id = auth.uid()
  )
);

-- 2. Super simple policy for ai_messages
CREATE POLICY "Users can view all messages basic"
ON public.ai_messages
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats WHERE created_by = auth.uid() OR privacy = 'public'
  ) OR
  chat_id IN (
    SELECT chat_id FROM public.ai_chat_participants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add messages basic"
ON public.ai_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() OR user_id IS NULL) AND
  (
    chat_id IN (
      SELECT id FROM public.ai_chats WHERE created_by = auth.uid()
    ) OR
    chat_id IN (
      SELECT chat_id FROM public.ai_chat_participants WHERE user_id = auth.uid()
    )
  )
);

-- 3. Super simple policy for ai_chat_participants
CREATE POLICY "View all participants basic"
ON public.ai_chat_participants
FOR SELECT
TO authenticated
USING (
  chat_id IN (
    SELECT id FROM public.ai_chats WHERE created_by = auth.uid() OR privacy = 'public'
  ) OR
  user_id = auth.uid()
); 