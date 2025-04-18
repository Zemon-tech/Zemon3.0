-- Migration: add_create_channel_function
-- Description: Adds stored procedure for creating channels to avoid RLS issues
-- Created at: 2025-04-15

-- Function to create a channel
create or replace function public.create_channel(channel_name text, channel_type text, is_private boolean)
returns public.channels as $$
declare
  current_user_id uuid;
  valid_type channel_type;
  new_channel public.channels;
begin
  -- Get the authenticated user's ID
  current_user_id := auth.uid();
  
  -- Check if user exists
  if not exists (select 1 from public.users where id = current_user_id) then
    raise exception 'User does not exist';
  end if;

  -- Validate channel type
  begin
    valid_type := channel_type::channel_type;
  exception when others then
    raise exception 'Invalid channel type. Must be "direct", "group", or "public"';
  end;
  
  -- Create the new channel
  insert into public.channels (name, type, is_private, created_by)
  values (channel_name, valid_type, is_private, current_user_id)
  returning * into new_channel;
  
  -- Note: The trigger will automatically add the creator as an admin member
  
  return new_channel;
end;
$$ language plpgsql security definer; 