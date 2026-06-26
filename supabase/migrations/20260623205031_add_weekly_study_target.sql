-- Safe SQL migration to add weekly_study_target to user_preferences
alter table public.user_preferences add column if not exists weekly_study_target integer not null default 20;
