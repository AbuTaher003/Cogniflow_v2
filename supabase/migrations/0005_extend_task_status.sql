-- Phase 3: Alter tasks status check constraint to support full Kanban system columns

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check check (status in ('backlog', 'todo', 'in_progress', 'review', 'done'));
