create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  role text not null default 'student',
  current_semester integer,
  target_cgpa numeric(4,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('student', 'creator', 'admin'))
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  code text,
  color text not null default '#7C3AED',
  credits integer not null default 3,
  instructor text,
  semester text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_credits_check check (credits > 0)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_at timestamptz,
  start_at timestamptz,
  completed_at timestamptz,
  estimated_minutes integer,
  tags text[] not null default '{}'::text[],
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_status_check check (status in ('todo', 'in_progress', 'blocked', 'done')),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint tasks_estimated_minutes_check check (estimated_minutes is null or estimated_minutes > 0)
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  title text not null,
  goal text,
  scheduled_for date not null,
  start_time time,
  end_time time,
  duration_minutes integer not null default 60,
  focus_mode boolean not null default false,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_plans_status_check check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  constraint study_plans_duration_check check (duration_minutes > 0)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  content text not null default '',
  format text not null default 'markdown',
  pinned boolean not null default false,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_format_check check (format in ('markdown', 'rich_text', 'plain'))
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  exam_type text not null default 'midterm',
  exam_date date not null,
  exam_time time,
  coverage text,
  target_score numeric(5,2),
  achieved_score numeric(5,2),
  status text not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exams_type_check check (exam_type in ('quiz', 'midterm', 'final', 'assignment', 'competitive', 'other')),
  constraint exams_status_check check (status in ('upcoming', 'completed', 'missed'))
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'productivity',
  frequency text not null default 'daily',
  target_count integer not null default 1,
  streak integer not null default 0,
  best_streak integer not null default 0,
  reminder_time time,
  color text not null default '#22C55E',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_frequency_check check (frequency in ('daily', 'weekly', 'custom')),
  constraint habits_target_count_check check (target_count > 0),
  constraint habits_streak_check check (streak >= 0 and best_streak >= 0)
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  session_type text not null default 'deep_work',
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  score integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint focus_sessions_type_check check (session_type in ('deep_work', 'pomodoro', 'revision', 'break')),
  constraint focus_sessions_duration_check check (duration_minutes is null or duration_minutes > 0),
  constraint focus_sessions_score_check check (score is null or score between 0 and 100)
);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  metric_date date not null,
  completed_tasks integer not null default 0,
  study_minutes integer not null default 0,
  focus_minutes integer not null default 0,
  habit_streak_score integer not null default 0,
  productivity_score numeric(5,2) not null default 0,
  mood_score numeric(5,2),
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_unique_per_day unique (user_id, metric_date),
  constraint analytics_metrics_check check (
    completed_tasks >= 0 and study_minutes >= 0 and focus_minutes >= 0 and habit_streak_score >= 0
  )
);

create table if not exists public.cgpa_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  semester text not null,
  current_cgpa numeric(4,2) not null,
  predicted_cgpa numeric(4,2) not null,
  target_cgpa numeric(4,2),
  projected_grade_distribution jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cgpa_predictions_scores_check check (
    current_cgpa between 0 and 10 and predicted_cgpa between 0 and 10 and (target_cgpa is null or target_cgpa between 0 and 10)
  )
);

create index if not exists idx_subjects_user_id on public.subjects (user_id);
create index if not exists idx_subjects_user_semester on public.subjects (user_id, semester);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_subject_id on public.tasks (subject_id);
create index if not exists idx_tasks_due_at on public.tasks (user_id, due_at);
create index if not exists idx_tasks_status on public.tasks (user_id, status);
create index if not exists idx_study_plans_user_id on public.study_plans (user_id);
create index if not exists idx_study_plans_subject_id on public.study_plans (subject_id);
create index if not exists idx_study_plans_scheduled_for on public.study_plans (user_id, scheduled_for);
create index if not exists idx_notes_user_id on public.notes (user_id);
create index if not exists idx_notes_subject_id on public.notes (subject_id);
create index if not exists idx_exams_user_id on public.exams (user_id);
create index if not exists idx_exams_subject_id on public.exams (subject_id);
create index if not exists idx_exams_exam_date on public.exams (user_id, exam_date);
create index if not exists idx_habits_user_id on public.habits (user_id);
create index if not exists idx_focus_sessions_user_id on public.focus_sessions (user_id);
create index if not exists idx_focus_sessions_started_at on public.focus_sessions (user_id, started_at desc);
create index if not exists idx_analytics_user_id on public.analytics (user_id);
create index if not exists idx_analytics_metric_date on public.analytics (user_id, metric_date desc);
create index if not exists idx_cgpa_predictions_user_id on public.cgpa_predictions (user_id);
create index if not exists idx_cgpa_predictions_semester on public.cgpa_predictions (user_id, semester);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at
before update on public.subjects
for each row execute procedure public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

drop trigger if exists set_study_plans_updated_at on public.study_plans;
create trigger set_study_plans_updated_at
before update on public.study_plans
for each row execute procedure public.set_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
before update on public.notes
for each row execute procedure public.set_updated_at();

drop trigger if exists set_exams_updated_at on public.exams;
create trigger set_exams_updated_at
before update on public.exams
for each row execute procedure public.set_updated_at();

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at
before update on public.habits
for each row execute procedure public.set_updated_at();

drop trigger if exists set_focus_sessions_updated_at on public.focus_sessions;
create trigger set_focus_sessions_updated_at
before update on public.focus_sessions
for each row execute procedure public.set_updated_at();

drop trigger if exists set_analytics_updated_at on public.analytics;
create trigger set_analytics_updated_at
before update on public.analytics
for each row execute procedure public.set_updated_at();

drop trigger if exists set_cgpa_predictions_updated_at on public.cgpa_predictions;
create trigger set_cgpa_predictions_updated_at
before update on public.cgpa_predictions
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.study_plans enable row level security;
alter table public.notes enable row level security;
alter table public.exams enable row level security;
alter table public.habits enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.analytics enable row level security;
alter table public.cgpa_predictions enable row level security;

drop policy if exists "Profiles can view own record" on public.profiles;
create policy "Profiles can view own record"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles can update own record" on public.profiles;
create policy "Profiles can update own record"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Subjects are scoped to user" on public.subjects;
create policy "Subjects are scoped to user"
on public.subjects
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Tasks are scoped to user" on public.tasks;
create policy "Tasks are scoped to user"
on public.tasks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Study plans are scoped to user" on public.study_plans;
create policy "Study plans are scoped to user"
on public.study_plans
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Notes are scoped to user" on public.notes;
create policy "Notes are scoped to user"
on public.notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Exams are scoped to user" on public.exams;
create policy "Exams are scoped to user"
on public.exams
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Habits are scoped to user" on public.habits;
create policy "Habits are scoped to user"
on public.habits
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Focus sessions are scoped to user" on public.focus_sessions;
create policy "Focus sessions are scoped to user"
on public.focus_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Analytics are scoped to user" on public.analytics;
create policy "Analytics are scoped to user"
on public.analytics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "CGPA predictions are scoped to user" on public.cgpa_predictions;
create policy "CGPA predictions are scoped to user"
on public.cgpa_predictions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);