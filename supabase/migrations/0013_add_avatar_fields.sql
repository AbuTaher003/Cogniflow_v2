-- Safe SQL migration to add avatar fields and storage bucket
alter table public.profiles add column if not exists avatar_type text not null default 'color';
alter table public.profiles add column if not exists avatar_value text not null default 'preset-1';
alter table public.profiles add column if not exists avatar_upload_url text;
alter table public.profiles add column if not exists avatar_cartoon_url text;
alter table public.profiles add column if not exists avatar_color_code text not null default 'preset-1';

-- Create "avatars" storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Setup policy: Allow public select access to "avatars"
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Setup policy: Allow authenticated users to upload/insert to "avatars"
drop policy if exists "Authenticated User Upload" on storage.objects;
create policy "Authenticated User Upload"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Setup policy: Allow authenticated users to update their own files in "avatars"
drop policy if exists "Authenticated User Update" on storage.objects;
create policy "Authenticated User Update"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Setup policy: Allow authenticated users to delete their own files in "avatars"
drop policy if exists "Authenticated User Delete" on storage.objects;
create policy "Authenticated User Delete"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
