-- Migration: fix_channel_infinite_recursion
-- Description: Completely fixes infinite recursion issues in channel_members policies
-- Created at: 2025-04-15

-- Drop all existing channel member policies to avoid duplicates
drop policy if exists "Users can view channel members they are part of" on public.channel_members;
drop policy if exists "Users can view all channel members" on public.channel_members;
drop policy if exists "Channel admins can add members" on public.channel_members;
drop policy if exists "Channel admins can remove members" on public.channel_members;
drop policy if exists "Users can leave channels" on public.channel_members;
drop policy if exists "Users can join public channels" on public.channel_members;

-- Create a base table to store direct channel memberships without policy checks
-- This avoids the circular reference problem
create table if not exists public.channel_membership_base (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (channel_id, user_id)
);

-- Create function to check direct membership without policy recursion
create or replace function public.has_direct_channel_membership(check_channel_id uuid, check_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 
    from public.channel_membership_base
    where channel_id = check_channel_id and user_id = check_user_id
  );
end;
$$ language plpgsql security definer;

-- Create trigger to automatically keep base table in sync with channel_members
create or replace function public.sync_channel_membership_base()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.channel_membership_base (channel_id, user_id)
    values (NEW.channel_id, NEW.user_id)
    on conflict do nothing;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    delete from public.channel_membership_base 
    where channel_id = OLD.channel_id and user_id = OLD.user_id;
    return OLD;
  end if;
  return NULL;
end;
$$ language plpgsql security definer;

-- Create triggers to sync changes between tables
drop trigger if exists on_channel_member_inserted on public.channel_members;
create trigger on_channel_member_inserted
  after insert on public.channel_members
  for each row execute procedure public.sync_channel_membership_base();

drop trigger if exists on_channel_member_deleted on public.channel_members;
create trigger on_channel_member_deleted
  after delete on public.channel_members
  for each row execute procedure public.sync_channel_membership_base();

-- Populate the base table with existing memberships
insert into public.channel_membership_base (channel_id, user_id)
select channel_id, user_id from public.channel_members
on conflict do nothing;

-- Create new non-recursive policies using the base membership table
create policy "Users can view channel members if they are members"
on public.channel_members
for select
to authenticated
using (
  public.has_direct_channel_membership(channel_id, auth.uid())
);

create policy "Users can join public channels"
on public.channel_members
for insert
to authenticated
with check (
  user_id = auth.uid() and
  exists (
    select 1 
    from public.channels
    where id = channel_id and type = 'public' and not is_private
  )
);

create policy "Channel admins can add members"
on public.channel_members
for insert
to authenticated
with check (
  exists (
    select 1 
    from public.channel_membership_base b
    join public.channel_members m on b.channel_id = m.channel_id and b.user_id = m.user_id
    where b.channel_id = channel_members.channel_id 
    and b.user_id = auth.uid() 
    and m.is_admin = true
  )
);

create policy "Users can leave channels"
on public.channel_members
for delete
to authenticated
using (user_id = auth.uid());

create policy "Channel admins can remove members"
on public.channel_members
for delete
to authenticated
using (
  exists (
    select 1 
    from public.channel_membership_base b
    join public.channel_members m on b.channel_id = m.channel_id and b.user_id = m.user_id
    where b.channel_id = channel_members.channel_id 
    and b.user_id = auth.uid() 
    and m.is_admin = true
  )
); 