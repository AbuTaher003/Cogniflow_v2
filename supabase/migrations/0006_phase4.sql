-- Phase 4: Production-Ready SaaS Migration
-- Covers: Resume Builder, Internship Tracker, CP Tracker, Kaggle Tracker,
--         Achievement System, Announcements, Feedback, Subscriptions

-- ============================================
-- RESUME BUILDER
-- ============================================
create table if not exists public.resumes (
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

create table if not exists public.resume_sections (
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

-- ============================================
-- INTERNSHIP TRACKER
-- ============================================
create table if not exists public.internship_applications (
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

-- ============================================
-- COMPETITIVE PROGRAMMING TRACKER
-- ============================================
create table if not exists public.cp_problems (
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

create table if not exists public.cp_contests (
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

-- ============================================
-- KAGGLE TRACKER
-- ============================================
create table if not exists public.kaggle_entries (
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

-- ============================================
-- ACHIEVEMENT SYSTEM
-- ============================================
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  constraint user_achievements_unique unique (user_id, achievement_key)
);

-- Add XP/level columns to profiles
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;

-- ============================================
-- ANNOUNCEMENT SYSTEM
-- ============================================
create table if not exists public.announcements (
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

-- ============================================
-- FEEDBACK SYSTEM
-- ============================================
create table if not exists public.feedback (
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

-- ============================================
-- SUBSCRIPTION SYSTEM
-- ============================================
create table if not exists public.subscriptions (
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

-- ============================================
-- INDEXES
-- ============================================
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

-- ============================================
-- TRIGGERS
-- ============================================
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

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.resumes enable row level security;
alter table public.resume_sections enable row level security;
alter table public.internship_applications enable row level security;
alter table public.cp_problems enable row level security;
alter table public.cp_contests enable row level security;
alter table public.kaggle_entries enable row level security;
alter table public.user_achievements enable row level security;
alter table public.announcements enable row level security;
alter table public.feedback enable row level security;
alter table public.subscriptions enable row level security;

-- Resumes
create policy "Resumes are scoped to user" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Resume sections via resume owner" on public.resume_sections for all using (
  exists (select 1 from public.resumes where resumes.id = resume_sections.resume_id and resumes.user_id = auth.uid())
) with check (
  exists (select 1 from public.resumes where resumes.id = resume_sections.resume_id and resumes.user_id = auth.uid())
);

-- Internship Applications
create policy "Internships are scoped to user" on public.internship_applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CP
create policy "CP problems are scoped to user" on public.cp_problems for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "CP contests are scoped to user" on public.cp_contests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Kaggle
create policy "Kaggle entries are scoped to user" on public.kaggle_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Achievements
create policy "Achievements are scoped to user" on public.user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Announcements (everyone can read published, admins can write)
create policy "Anyone can read published announcements" on public.announcements for select using (published = true);
create policy "Admins can manage announcements" on public.announcements for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
) with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Feedback
create policy "Users can manage own feedback" on public.feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins can read all feedback" on public.feedback for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Subscriptions
create policy "Subscriptions are scoped to user" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
