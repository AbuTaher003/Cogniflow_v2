-- ====================================================================
-- CogniFlow Unified Database Schema (Staging - RLS Disabled)
-- ====================================================================

-- Start transaction to ensure all tables create successfully or roll back
BEGIN;

-- Enable pgcrypto extension for UUID generation if needed
create extension if not exists pgcrypto;

-- ====================================================================
-- 1. DROP EXISTING OBJECTS (Ensures clean execution from scratch)
-- ====================================================================
drop table if exists public.subscriptions cascade;
drop table if exists public.feedback cascade;
drop table if exists public.announcements cascade;
drop table if exists public.user_achievements cascade;
drop table if exists public.kaggle_entries cascade;
drop table if exists public.cp_contests cascade;
drop table if exists public.cp_problems cascade;
drop table if exists public.internship_applications cascade;
drop table if exists public.resume_sections cascade;
drop table if exists public.resumes cascade;
drop table if exists public.chapters cascade;
drop table if exists public.user_preferences cascade;
drop table if exists public.notifications cascade;
drop table if exists public.cgpa_predictions cascade;
drop table if exists public.analytics cascade;
drop table if exists public.focus_sessions cascade;
drop table if exists public.habit_logs cascade;
drop table if exists public.habits cascade;
drop table if exists public.exams cascade;
drop table if exists public.notes cascade;
drop table if exists public.study_plans cascade;
drop table if exists public.tasks cascade;
drop table if exists public.subjects cascade;
drop table if exists public.profiles cascade;

drop function if exists public.set_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_profile_preferences() cascade;

-- ====================================================================
-- 2. UTILITY FUNCTIONS & TRIGGER FUNCTIONS
-- ====================================================================

-- Function to update updated_at timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger function to handle user profile creation on auth sign-up
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

-- Trigger function to auto-initialize preferences on profile creation
create or replace function public.handle_new_profile_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ====================================================================
-- 3. TABLE DEFINITIONS (Ordered by dependency hierarchy)
-- ====================================================================

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  avatar_type text not null default 'color',
  avatar_value text not null default 'preset-1',
  avatar_upload_url text,
  avatar_cartoon_url text,
  avatar_color_code text not null default 'preset-1',
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  role text not null default 'student',
  current_semester integer,
  target_cgpa numeric(4,2),
  university text,
  department text,
  skills text[] not null default '{}'::text[],
  career_goal text,
  study_hours_per_day integer default 4,
  onboarding_step integer not null default 0,
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('student', 'creator', 'admin'))
);

-- Subjects
create table public.subjects (
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

-- Tasks
create table public.tasks (
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
  constraint tasks_status_check check (status in ('backlog', 'todo', 'in_progress', 'review', 'done')),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint tasks_estimated_minutes_check check (estimated_minutes is null or estimated_minutes > 0)
);

-- Study Plans
create table public.study_plans (
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

-- Notes
create table public.notes (
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

-- Exams
create table public.exams (
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

-- Habits
create table public.habits (
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

-- Habit Logs
create table public.habit_logs (
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

-- Focus Sessions
create table public.focus_sessions (
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

-- Analytics
create table public.analytics (
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

-- CGPA Predictions
create table public.cgpa_predictions (
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

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'info',
  title text not null,
  message text,
  read boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('info', 'exam_reminder', 'task_reminder', 'habit_reminder', 'achievement', 'system'))
);

-- User Preferences
create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  theme text not null default 'dark',
  sidebar_collapsed boolean not null default false,
  notification_email boolean not null default true,
  notification_push boolean not null default true,
  notification_exam_reminder boolean not null default true,
  notification_task_reminder boolean not null default true,
  notification_habit_reminder boolean not null default true,
  weekly_study_target integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check check (theme in ('light', 'dark', 'system')),
  constraint user_preferences_unique_user unique (user_id)
);

-- Chapters
create table public.chapters (
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

-- Resumes
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled Resume',
  template text not null default 'modern',
  full_name text,
  email text,
  phone text,
  location text,
  website text,
  linkedin text,
  github text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resumes_template_check check (template in ('modern', 'professional', 'minimal', 'ats'))
);

-- Resume Sections
create table public.resume_sections (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes (id) on delete cascade,
  section_type text not null,
  title text,
  data jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resume_sections_type_check check (section_type in ('education', 'experience', 'skills', 'projects', 'certifications', 'custom'))
);

-- Internship Applications
create table public.internship_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_name text not null,
  position text not null,
  location text,
  application_date date not null default current_date,
  status text not null default 'applied',
  url text,
  salary text,
  notes text,
  interview_date timestamptz,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internship_status_check check (status in ('applied', 'assessment', 'interview', 'final_round', 'offer', 'rejected'))
);

-- CP Problems
create table public.cp_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'leetcode',
  problem_name text not null,
  problem_url text,
  difficulty text not null default 'medium',
  status text not null default 'solved',
  topic text,
  time_taken_minutes integer,
  notes text,
  solved_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cp_platform_check check (platform in ('leetcode', 'codeforces', 'atcoder', 'other')),
  constraint cp_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  constraint cp_status_check check (status in ('solved', 'attempted', 'revisit'))
);

-- CP Contests
create table public.cp_contests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default 'leetcode',
  contest_name text not null,
  contest_url text,
  rank integer,
  problems_solved integer not null default 0,
  total_problems integer,
  rating_change integer,
  contest_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kaggle Entries
create table public.kaggle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_type text not null default 'competition',
  title text not null,
  url text,
  status text not null default 'active',
  medal text,
  team_size integer default 1,
  description text,
  started_at date,
  ended_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kaggle_type_check check (entry_type in ('competition', 'dataset', 'notebook')),
  constraint kaggle_status_check check (status in ('active', 'completed', 'abandoned')),
  constraint kaggle_medal_check check (medal is null or medal in ('gold', 'silver', 'bronze'))
);

-- User Achievements
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  constraint user_achievements_unique unique (user_id, achievement_key)
);

-- Announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  content text not null,
  category text not null default 'update',
  pinned boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_category_check check (category in ('update', 'maintenance', 'release', 'announcement'))
);

-- Feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  feedback_type text not null default 'feedback',
  title text not null,
  description text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_type_check check (feedback_type in ('feedback', 'bug', 'feature')),
  constraint feedback_status_check check (status in ('open', 'in_progress', 'resolved', 'closed')),
  constraint feedback_priority_check check (priority in ('low', 'medium', 'high'))
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  features jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_plan_check check (plan in ('free', 'pro', 'premium')),
  constraint subscriptions_status_check check (status in ('active', 'expired', 'cancelled')),
  constraint subscriptions_unique_user unique (user_id)
);

-- ====================================================================
-- 4. INDEXES
-- ====================================================================
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
create index if not exists idx_habit_logs_user_id on public.habit_logs (user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs (habit_id);
create index if not exists idx_habit_logs_completed_at on public.habit_logs (user_id, completed_at desc);
create index if not exists idx_focus_sessions_user_id on public.focus_sessions (user_id);
create index if not exists idx_focus_sessions_started_at on public.focus_sessions (user_id, started_at desc);
create index if not exists idx_analytics_user_id on public.analytics (user_id);
create index if not exists idx_analytics_metric_date on public.analytics (user_id, metric_date desc);
create index if not exists idx_cgpa_predictions_user_id on public.cgpa_predictions (user_id);
create index if not exists idx_cgpa_predictions_semester on public.cgpa_predictions (user_id, semester);
create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read);
create index if not exists idx_notifications_created_at on public.notifications (user_id, created_at desc);
create index if not exists idx_user_preferences_user_id on public.user_preferences (user_id);
create index if not exists idx_chapters_user_id on public.chapters (user_id);
create index if not exists idx_chapters_subject_id on public.chapters (subject_id);
create index if not exists idx_resumes_user_id on public.resumes (user_id);
create index if not exists idx_resume_sections_resume_id on public.resume_sections (resume_id);
create index if not exists idx_internship_apps_user_id on public.internship_applications (user_id);
create index if not exists idx_internship_apps_status on public.internship_applications (user_id, status);
create index if not exists idx_cp_problems_user_id on public.cp_problems (user_id);
create index if not exists idx_cp_problems_platform on public.cp_problems (user_id, platform);
create index if not exists idx_cp_contests_user_id on public.cp_contests (user_id);
create index if not exists idx_kaggle_entries_user_id on public.kaggle_entries (user_id);
create index if not exists idx_user_achievements_user_id on public.user_achievements (user_id);
create index if not exists idx_announcements_published on public.announcements (published, created_at desc);
create index if not exists idx_feedback_user_id on public.feedback (user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

-- ====================================================================
-- 5. TRIGGERS
-- ====================================================================

-- Auth new user hook
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Profiles update hook
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();

-- Auto-preferences hook
drop trigger if exists on_profile_created_preferences on public.profiles;
create trigger on_profile_created_preferences
after insert on public.profiles
for each row execute procedure public.handle_new_profile_preferences();

-- Other tables update hooks (Drop first to make idempotent)
drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at before update on public.subjects for each row execute procedure public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute procedure public.set_updated_at();

drop trigger if exists set_study_plans_updated_at on public.study_plans;
create trigger set_study_plans_updated_at before update on public.study_plans for each row execute procedure public.set_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at before update on public.notes for each row execute procedure public.set_updated_at();

drop trigger if exists set_exams_updated_at on public.exams;
create trigger set_exams_updated_at before update on public.exams for each row execute procedure public.set_updated_at();

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at before update on public.habits for each row execute procedure public.set_updated_at();

drop trigger if exists set_habit_logs_updated_at on public.habit_logs;
create trigger set_habit_logs_updated_at before update on public.habit_logs for each row execute procedure public.set_updated_at();

drop trigger if exists set_focus_sessions_updated_at on public.focus_sessions;
create trigger set_focus_sessions_updated_at before update on public.focus_sessions for each row execute procedure public.set_updated_at();

drop trigger if exists set_analytics_updated_at on public.analytics;
create trigger set_analytics_updated_at before update on public.analytics for each row execute procedure public.set_updated_at();

drop trigger if exists set_cgpa_predictions_updated_at on public.cgpa_predictions;
create trigger set_cgpa_predictions_updated_at before update on public.cgpa_predictions for each row execute procedure public.set_updated_at();

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at before update on public.user_preferences for each row execute procedure public.set_updated_at();

drop trigger if exists set_chapters_updated_at on public.chapters;
create trigger set_chapters_updated_at before update on public.chapters for each row execute procedure public.set_updated_at();

drop trigger if exists set_resumes_updated_at on public.resumes;
create trigger set_resumes_updated_at before update on public.resumes for each row execute procedure public.set_updated_at();

drop trigger if exists set_resume_sections_updated_at on public.resume_sections;
create trigger set_resume_sections_updated_at before update on public.resume_sections for each row execute procedure public.set_updated_at();

drop trigger if exists set_internship_apps_updated_at on public.internship_applications;
create trigger set_internship_apps_updated_at before update on public.internship_applications for each row execute procedure public.set_updated_at();

drop trigger if exists set_cp_problems_updated_at on public.cp_problems;
create trigger set_cp_problems_updated_at before update on public.cp_problems for each row execute procedure public.set_updated_at();

drop trigger if exists set_cp_contests_updated_at on public.cp_contests;
create trigger set_cp_contests_updated_at before update on public.cp_contests for each row execute procedure public.set_updated_at();

drop trigger if exists set_kaggle_entries_updated_at on public.kaggle_entries;
create trigger set_kaggle_entries_updated_at before update on public.kaggle_entries for each row execute procedure public.set_updated_at();

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at before update on public.announcements for each row execute procedure public.set_updated_at();

drop trigger if exists set_feedback_updated_at on public.feedback;
create trigger set_feedback_updated_at before update on public.feedback for each row execute procedure public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.set_updated_at();

-- ====================================================================
-- 6. DISABLE ROW LEVEL SECURITY (RLS OFF)
-- ====================================================================
alter table public.profiles disable row level security;
alter table public.subjects disable row level security;
alter table public.tasks disable row level security;
alter table public.study_plans disable row level security;
alter table public.notes disable row level security;
alter table public.exams disable row level security;
alter table public.habits disable row level security;
alter table public.habit_logs disable row level security;
alter table public.focus_sessions disable row level security;
alter table public.analytics disable row level security;
alter table public.cgpa_predictions disable row level security;
alter table public.notifications disable row level security;
alter table public.user_preferences disable row level security;
alter table public.chapters disable row level security;
alter table public.resumes disable row level security;
alter table public.resume_sections disable row level security;
alter table public.internship_applications disable row level security;
alter table public.cp_problems disable row level security;
alter table public.cp_contests disable row level security;
alter table public.kaggle_entries disable row level security;
alter table public.user_achievements disable row level security;
alter table public.announcements disable row level security;
alter table public.feedback disable row level security;
alter table public.subscriptions disable row level security;

-- Finish transaction and apply all modifications
COMMIT;
