-- Migration: add_channel_members_function
-- Description: Adds stored procedure for adding members to channels
-- Created at: 2025-04-15

-- Function to add multiple members to a channel
create or replace function public.add_channel_members(p_channel_id uuid, p_user_ids uuid[])
returns void as $$
declare
  current_user_id uuid;
  user_id_var uuid;
begin
  -- Get the authenticated user's ID
  current_user_id := auth.uid();
  
  -- Verify the current user is an admin of the channel
  if not exists (
    select 1 
    from public.channel_members 
    where channel_id = p_channel_id 
    and user_id = current_user_id 
    and is_admin = true
  ) then
    raise exception 'You must be a channel admin to add members';
  end if;
  
  -- Add each user as a member
  foreach user_id_var in array p_user_ids
  loop
    -- Check if user exists
    if not exists (select 1 from public.users where id = user_id_var) then
      raise warning 'User % does not exist', user_id_var;
      continue;
    end if;
    
    -- Skip if already a member
    if exists (
      select 1 
      from public.channel_members 
      where channel_id = p_channel_id and user_id = user_id_var
    ) then
      continue;
    end if;
    
    -- Add the user to the channel
    insert into public.channel_members (channel_id, user_id, is_admin)
    values (p_channel_id, user_id_var, false);
  end loop;
end;
$$ language plpgsql security definer; 