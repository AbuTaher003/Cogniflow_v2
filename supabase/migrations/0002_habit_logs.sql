-- Migration: Add habit_logs table for tracking daily habit completions
-- This table records each time a habit is completed, enabling streak calculation.

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_date date not null default current_date,
  count integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_logs_count_check check (count > 0),
  constraint habit_logs_unique_per_day unique (habit_id, completed_date)
);

-- Indexes
create index if not exists idx_habit_logs_user_id on public.habit_logs (user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs (habit_id);
create index if not exists idx_habit_logs_completed_at on public.habit_logs (user_id, completed_at desc);

-- Updated_at trigger
drop trigger if exists set_habit_logs_updated_at on public.habit_logs;
create trigger set_habit_logs_updated_at
before update on public.habit_logs
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.habit_logs enable row level security;

drop policy if exists "Habit logs are scoped to user" on public.habit_logs;
create policy "Habit logs are scoped to user"
on public.habit_logs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
