-- Phase 3: Add chapters table to support the Study Planner module

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  status text not null default 'todo',
  progress_pct integer not null default 0,
  estimated_minutes integer not null default 60,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chapters_status_check check (status in ('todo', 'in_progress', 'completed')),
  constraint chapters_progress_pct_check check (progress_pct between 0 and 100),
  constraint chapters_estimated_minutes_check check (estimated_minutes > 0)
);

-- Indexes
create index if not exists idx_chapters_user_id on public.chapters (user_id);
create index if not exists idx_chapters_subject_id on public.chapters (subject_id);

-- Updated_at trigger
drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at
before update on public.chapters
for each row execute procedure public.set_updated_at();

-- Enable RLS
alter table public.chapters enable row level security;

-- Scope RLS Policy
drop policy if exists "Chapters are scoped to user" on public.chapters;
create policy "Chapters are scoped to user"
on public.chapters
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
