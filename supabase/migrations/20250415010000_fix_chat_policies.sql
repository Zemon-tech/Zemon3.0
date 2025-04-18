-- Migration: fix_chat_policies
-- Description: Fixes infinite recursion in channel_members policies
-- Created at: 2025-04-15

-- Drop the problematic policies
drop policy if exists "Users can view all channel members" on public.channel_members;
drop policy if exists "Channel admins can add members" on public.channel_members;
drop policy if exists "Channel admins can remove members" on public.channel_members;

-- Create fixed policies
create policy "Users can view all channel members" 
on public.channel_members
for select
to authenticated
using (
  -- Use directly the channel_id from the current record
  -- and a subquery to avoid the recursion
  exists (
    select 1 
    from public.channel_members as self 
    where self.channel_id = channel_members.channel_id and self.user_id = auth.uid()
  )
);

create policy "Channel admins can add members"
on public.channel_members
for insert
to authenticated
with check (
  -- Use a table alias to avoid recursion
  exists (
    select 1 
    from public.channel_members as admins
    where admins.channel_id = channel_members.channel_id 
    and admins.user_id = auth.uid() 
    and admins.is_admin = true
  )
);

create policy "Channel admins can remove members"
on public.channel_members
for delete
to authenticated
using (
  -- Use a table alias to avoid recursion
  exists (
    select 1 
    from public.channel_members as admins
    where admins.channel_id = channel_members.channel_id 
    and admins.user_id = auth.uid() 
    and admins.is_admin = true
  )
); 