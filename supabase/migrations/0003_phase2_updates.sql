-- Phase 2: Extend profiles, add notifications and user_preferences tables

-- ============================================================
-- 1. Extend profiles table
-- ============================================================
alter table public.profiles
  add column if not exists university text,
  add column if not exists department text,
  add column if not exists skills text[] not null default '{}'::text[],
  add column if not exists career_goal text,
  add column if not exists study_hours_per_day integer default 4,
  add column if not exists onboarding_step integer not null default 0;

-- ============================================================
-- 2. Notifications table
-- ============================================================
create table if not exists public.notifications (
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

create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_user_read on public.notifications (user_id, read);
create index if not exists idx_notifications_created_at on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Notifications are scoped to user" on public.notifications;
create policy "Notifications are scoped to user"
on public.notifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================
-- 3. User preferences table
-- ============================================================
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  theme text not null default 'dark',
  sidebar_collapsed boolean not null default false,
  notification_email boolean not null default true,
  notification_push boolean not null default true,
  notification_exam_reminder boolean not null default true,
  notification_task_reminder boolean not null default true,
  notification_habit_reminder boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_theme_check check (theme in ('light', 'dark', 'system')),
  constraint user_preferences_unique_user unique (user_id)
);

create index if not exists idx_user_preferences_user_id on public.user_preferences (user_id);

drop trigger if exists set_user_preferences_updated_at on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row execute procedure public.set_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists "User preferences are scoped to user" on public.user_preferences;
create policy "User preferences are scoped to user"
on public.user_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================
-- 4. Auto-create user_preferences on profile creation
-- ============================================================
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

drop trigger if exists on_profile_created_preferences on public.profiles;
create trigger on_profile_created_preferences
after insert on public.profiles
for each row execute procedure public.handle_new_profile_preferences();
