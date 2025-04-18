-- Migration: create_ai_chat_schema
-- Description: Adds tables for storing AI chats and messages
-- Created at: 2025-04-15

-- Create AI chat privacy enum
create type if not exists ai_chat_privacy as enum ('private', 'public', 'team');

-- Create AI chat table
create table public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references public.users(id) on delete cascade,
  privacy ai_chat_privacy not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.ai_chats is 'Stores AI chat conversations';

-- Create AI messages table
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  is_ai boolean not null default false,
  content text not null,
  created_at timestamptz not null default now()
);
comment on table public.ai_messages is 'Stores messages in AI chat conversations';

-- Create AI chat participants table
create table public.ai_chat_participants (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  can_edit boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (chat_id, user_id)
);
comment on table public.ai_chat_participants is 'Stores participants in AI chat conversations';

-- Add RLS policies
alter table public.ai_chats enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_chat_participants enable row level security;

-- Policies for AI chats
create policy "Users can view their own AI chats"
on public.ai_chats
for select
to authenticated
using (
  created_by = auth.uid() or
  privacy = 'public' or
  (privacy = 'team' and id in (
    select chat_id from public.ai_chat_participants
    where user_id = auth.uid()
  ))
);

create policy "Users can create AI chats"
on public.ai_chats
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Users can update their own AI chats"
on public.ai_chats
for update
to authenticated
using (created_by = auth.uid());

create policy "Users can delete their own AI chats"
on public.ai_chats
for delete
to authenticated
using (created_by = auth.uid());

-- Policies for AI messages
create policy "Users can view messages in accessible chats"
on public.ai_messages
for select
to authenticated
using (
  exists (
    select 1 from public.ai_chats
    where id = chat_id and (
      created_by = auth.uid() or
      privacy = 'public' or
      (privacy = 'team' and id in (
        select chat_id from public.ai_chat_participants
        where user_id = auth.uid()
      ))
    )
  )
);

create policy "Users can add messages to accessible chats"
on public.ai_messages
for insert
to authenticated
with check (
  (user_id = auth.uid() or user_id is null) and
  exists (
    select 1 from public.ai_chats
    where id = chat_id and (
      created_by = auth.uid() or
      (privacy = 'team' and id in (
        select chat_id from public.ai_chat_participants
        where user_id = auth.uid()
      ))
    )
  )
);

create policy "Users can update their own messages"
on public.ai_messages
for update
to authenticated
using (user_id = auth.uid());

create policy "Users can delete their own messages"
on public.ai_messages
for delete
to authenticated
using (user_id = auth.uid());

-- Policies for AI chat participants
create policy "Users can view participants in accessible chats"
on public.ai_chat_participants
for select
to authenticated
using (
  exists (
    select 1 from public.ai_chats
    where id = chat_id and (
      created_by = auth.uid() or
      privacy = 'public' or
      (privacy = 'team' and chat_id in (
        select chat_id from public.ai_chat_participants
        where user_id = auth.uid()
      ))
    )
  )
);

create policy "Chat creators can add participants"
on public.ai_chat_participants
for insert
to authenticated
with check (
  exists (
    select 1 from public.ai_chats
    where id = chat_id and created_by = auth.uid()
  )
);

create policy "Chat creators can update participants"
on public.ai_chat_participants
for update
to authenticated
using (
  exists (
    select 1 from public.ai_chats
    where id = chat_id and created_by = auth.uid()
  )
);

create policy "Chat creators can remove participants"
on public.ai_chat_participants
for delete
to authenticated
using (
  exists (
    select 1 from public.ai_chats
    where id = chat_id and created_by = auth.uid()
  )
);

-- Add triggers for updated_at
create trigger handle_ai_chats_updated_at
  before update on public.ai_chats
  for each row execute procedure public.handle_updated_at();

-- Automatically add creator as participant
create or replace function public.handle_new_ai_chat()
returns trigger as $$
begin
  insert into public.ai_chat_participants (chat_id, user_id, can_edit)
  values (new.id, new.created_by, true);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_ai_chat_created
  after insert on public.ai_chats
  for each row execute procedure public.handle_new_ai_chat(); 