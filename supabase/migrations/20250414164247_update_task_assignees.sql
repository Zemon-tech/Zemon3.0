-- Migration: update_task_assignees
-- Description: Replace task_assignments table with assignee_ids array in tasks table
-- Created at: 2025-04-14

-- Add assignee_ids array column to tasks table
alter table public.tasks 
add column assignee_ids uuid[] default '{}';

-- Migrate existing assignments to the new array column
do $$
declare
  t record;
begin
  for t in 
    select task_id, array_agg(user_id) as user_ids 
    from public.task_assignments 
    group by task_id
  loop
    update public.tasks 
    set assignee_ids = t.user_ids 
    where id = t.task_id;
  end loop;
end
$$;

-- Drop existing task_assignments RLS policies
drop policy if exists "Users can view all task assignments" on public.task_assignments;
drop policy if exists "Users can assign tasks they created" on public.task_assignments;
drop policy if exists "Team leaders and admins can create any assignment" on public.task_assignments;
drop policy if exists "Users can remove assignment for tasks they created" on public.task_assignments;
drop policy if exists "Team leaders and admins can delete any assignment" on public.task_assignments;

-- Drop indexes on task_assignments table
drop index if exists task_assignments_task_id_idx;
drop index if exists task_assignments_user_id_idx;

-- Drop task_assignments table
drop table if exists public.task_assignments;

-- Create index on the new assignee_ids column for better performance
create index tasks_assignee_ids_idx on public.tasks using gin (assignee_ids);

-- Create a comment for the new column
comment on column public.tasks.assignee_ids is 'Array of user IDs to whom the task is assigned'; 