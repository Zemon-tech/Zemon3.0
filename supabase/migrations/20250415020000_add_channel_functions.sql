-- Migration: add_channel_functions
-- Description: Adds stored procedures for channels to avoid RLS issues
-- Created at: 2025-04-15

-- Function to get all channels for a user
create or replace function public.get_user_channels(user_id uuid)
returns setof public.channels as $$
  select c.*
  from public.channels c
  join public.channel_members cm on c.id = cm.channel_id
  where cm.user_id = get_user_channels.user_id
  order by c.updated_at desc;
$$ language sql security definer;

-- Function to get all messages for a channel
create or replace function public.get_channel_messages(channel_id uuid, user_id uuid)
returns setof public.messages as $$
  -- First check if user is a member of the channel
  with member_check as (
    select 1
    from public.channel_members
    where channel_id = get_channel_messages.channel_id
    and user_id = get_channel_messages.user_id
    limit 1
  )
  select m.*
  from public.messages m
  where
    m.channel_id = get_channel_messages.channel_id
    and exists (select 1 from member_check)
  order by m.created_at asc;
$$ language sql security definer;

-- Function to get all members of a channel
create or replace function public.get_channel_members(channel_id uuid, user_id uuid)
returns table(
  member_id uuid,
  member_name text,
  member_email text,
  is_admin boolean,
  joined_at timestamptz
) as $$
  -- First check if user is a member of the channel
  with member_check as (
    select 1
    from public.channel_members
    where channel_id = get_channel_members.channel_id
    and user_id = get_channel_members.user_id
    limit 1
  )
  select 
    u.id as member_id,
    u.name as member_name,
    u.email as member_email,
    cm.is_admin,
    cm.joined_at
  from public.channel_members cm
  join public.users u on cm.user_id = u.id
  where 
    cm.channel_id = get_channel_members.channel_id
    and exists (select 1 from member_check)
  order by cm.is_admin desc, u.name;
$$ language sql security definer; 

-- Function to create a direct message channel between the current user and another user
-- This avoids RLS policy issues when creating channel members
create or replace function public.create_user_channel(other_user_id uuid, channel_name text)
returns public.channels as $$
declare
  current_user_id uuid;
  new_channel public.channels;
begin
  -- Get the authenticated user's ID
  current_user_id := auth.uid();
  
  -- Check if users exist
  if not exists (select 1 from public.users where id = current_user_id) or
     not exists (select 1 from public.users where id = other_user_id) then
    raise exception 'One or both users do not exist';
  end if;

  -- Check if channel already exists with this name
  if exists (select 1 from public.channels where name = channel_name and type = 'direct') then
    select * into new_channel from public.channels where name = channel_name and type = 'direct' limit 1;
    return new_channel;
  end if;
  
  -- Create the new direct message channel
  insert into public.channels (name, type, is_private, created_by)
  values (channel_name, 'direct', true, current_user_id)
  returning * into new_channel;
  
  -- Add both users as members (creator is already added by trigger, add the other user)
  -- Adding members explicitly to bypass RLS policies
  if not exists (select 1 from public.channel_members where channel_id = new_channel.id and user_id = other_user_id) then
    insert into public.channel_members (channel_id, user_id, is_admin)
    values (new_channel.id, other_user_id, false);
  end if;
  
  return new_channel;
end;
$$ language plpgsql security definer; 