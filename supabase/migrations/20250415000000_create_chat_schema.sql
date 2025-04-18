-- Migration: create_chat_schema
-- Description: Adds chat functionality with channels, messages, and memberships
-- Created at: 2025-04-15

-- Create custom types for chat
create type channel_type as enum ('direct', 'group', 'public');
create type message_status as enum ('sent', 'delivered', 'read');

-- Create channels table
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  type channel_type not null,
  is_private boolean not null default false,
  created_by uuid not null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.channels is 'Stores chat channels including direct messages, group chats, and public channels';

-- Create channel_members junction table
create table public.channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  unique (channel_id, user_id)
);
comment on table public.channel_members is 'Stores which users are members of which channels';

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete set null,
  content text not null,
  status message_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.messages is 'Stores individual chat messages';

-- Enable Row Level Security
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;

-- Create RLS policies for channels table
create policy "Users can view channels they are members of"
on public.channels
for select
to authenticated
using (
  exists (
    select 1 from public.channel_members
    where channel_id = id and user_id = auth.uid()
  )
  or
  (type = 'public' and not is_private)
);

create policy "Users can create channels"
on public.channels
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Channel admins can update channels"
on public.channels
for update
to authenticated
using (
  exists (
    select 1 from public.channel_members
    where channel_id = id and user_id = auth.uid() and is_admin = true
  )
);

create policy "Channel admins can delete channels"
on public.channels
for delete
to authenticated
using (
  exists (
    select 1 from public.channel_members
    where channel_id = id and user_id = auth.uid() and is_admin = true
  )
);

-- Create RLS policies for channel_members table
create policy "Users can view channel members they are part of"
on public.channel_members
for select
to authenticated
using (
  exists (
    select 1 from public.channel_members as cm
    where cm.channel_id = channel_id and cm.user_id = auth.uid()
  )
);

create policy "Users can join public channels"
on public.channel_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.channels
    where id = channel_id and type = 'public' and not is_private
  )
  and
  user_id = auth.uid()
);

create policy "Channel admins can add members"
on public.channel_members
for insert
to authenticated
with check (
  exists (
    select 1 from public.channel_members as cm
    where cm.channel_id = channel_id and cm.user_id = auth.uid() and cm.is_admin = true
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
    select 1 from public.channel_members as cm
    where cm.channel_id = channel_id and cm.user_id = auth.uid() and cm.is_admin = true
  )
);

-- Create RLS policies for messages table
create policy "Users can view messages in their channels"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.channel_members
    where channel_id = messages.channel_id and user_id = auth.uid()
  )
);

create policy "Users can send messages to their channels"
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1 from public.channel_members
    where channel_id = messages.channel_id and user_id = auth.uid()
  )
  and
  user_id = auth.uid()
);

create policy "Users can update their own messages"
on public.messages
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own messages"
on public.messages
for delete
to authenticated
using (user_id = auth.uid());

-- Add updated_at trigger for new tables
create trigger handle_channels_updated_at
  before update on public.channels
  for each row execute procedure public.handle_updated_at();

create trigger handle_messages_updated_at
  before update on public.messages
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index channels_type_idx on public.channels (type);
create index channels_created_by_idx on public.channels (created_by);
create index channel_members_channel_id_idx on public.channel_members (channel_id);
create index channel_members_user_id_idx on public.channel_members (user_id);
create index messages_channel_id_idx on public.messages (channel_id);
create index messages_user_id_idx on public.messages (user_id);
create index messages_created_at_idx on public.messages (created_at);

-- Create function and trigger to automatically add creator as admin member
create or replace function public.handle_new_channel()
returns trigger as $$
begin
  insert into public.channel_members (channel_id, user_id, is_admin)
  values (new.id, new.created_by, true);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_channel_created
  after insert on public.channels
  for each row execute procedure public.handle_new_channel();

-- Enable realtime for chat tables
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.channel_members;
alter publication supabase_realtime add table public.messages;