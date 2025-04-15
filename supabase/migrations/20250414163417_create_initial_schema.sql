-- Migration: create_initial_schema
-- Description: Creates the initial schema for users, tasks, and resources with RLS policies
-- Created at: 2025-04-14

-- Create custom types
create type user_role as enum ('member', 'team_leader', 'admin');
create type task_priority as enum ('low', 'medium', 'high');
create type task_progress as enum ('to do', 'in progress', 'review', 'completed');
create type resource_type as enum ('tool', 'video', 'documentation');

-- Create users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.users is 'Stores user profiles with references to auth.users';

-- Create tasks table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority task_priority not null default 'medium',
  due_date timestamptz,
  progress task_progress not null default 'to do',
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tasks is 'Stores tasks with their metadata and progress status';

-- Create task assignments junction table
create table public.task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (task_id, user_id)
);
comment on table public.task_assignments is 'Junction table connecting tasks to assigned users';

-- Create resources table
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type resource_type not null,
  url text,
  uploaded_by uuid not null references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.resources is 'Stores resources like tools, videos, and documentation';

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.resources enable row level security;

-- Create RLS policies for users table
create policy "Users can view all user profiles" 
on public.users 
for select 
to authenticated 
using (true);

create policy "Users can update their own profile" 
on public.users 
for update 
to authenticated 
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admin users can update any profile" 
on public.users 
for update 
to authenticated 
using (
  auth.uid() in (
    select id from public.users where role = 'admin'
  )
);

-- Create RLS policies for tasks table
create policy "Users can view all tasks" 
on public.tasks 
for select 
to authenticated 
using (true);

create policy "Team leaders and admins can create tasks" 
on public.tasks 
for insert 
to authenticated 
with check (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
);

create policy "Team leaders and admins can update any task" 
on public.tasks 
for update 
to authenticated 
using (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
)
with check (true);

create policy "Team leaders and admins can delete any task" 
on public.tasks 
for delete 
to authenticated 
using (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
);

-- Create RLS policies for task_assignments table
create policy "Users can view all task assignments" 
on public.task_assignments 
for select 
to authenticated 
using (true);

create policy "Users can assign tasks they created" 
on public.task_assignments 
for insert 
to authenticated 
with check (
  auth.uid() in (
    select created_by from public.tasks 
    where id = task_id
  )
);

create policy "Team leaders and admins can create any assignment" 
on public.task_assignments 
for insert 
to authenticated 
with check (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
);

create policy "Users can remove assignment for tasks they created" 
on public.task_assignments 
for delete 
to authenticated 
using (
  auth.uid() in (
    select created_by from public.tasks 
    where id = task_id
  )
);

create policy "Team leaders and admins can delete any assignment" 
on public.task_assignments 
for delete 
to authenticated 
using (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
);

-- Create RLS policies for resources table
create policy "Users can view all resources" 
on public.resources 
for select 
to authenticated 
using (true);

create policy "Team leaders and admins can create resources" 
on public.resources 
for insert 
to authenticated 
with check (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
);

create policy "Team leaders and admins can update any resource" 
on public.resources 
for update 
to authenticated 
using (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
)
with check (true);

create policy "Team leaders and admins can delete any resource" 
on public.resources 
for delete 
to authenticated 
using (
  auth.uid() in (
    select id from public.users 
    where role in ('team_leader', 'admin')
  )
);

-- Create trigger to add users to users table after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    'member'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function and trigger for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger handle_resources_updated_at
  before update on public.resources
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index users_role_idx on public.users (role);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_progress_idx on public.tasks (progress);
create index tasks_priority_idx on public.tasks (priority);
create index tasks_due_date_idx on public.tasks (due_date);
create index task_assignments_task_id_idx on public.task_assignments (task_id);
create index task_assignments_user_id_idx on public.task_assignments (user_id);
create index resources_type_idx on public.resources (type);
create index resources_uploaded_by_idx on public.resources (uploaded_by); 