-- Add policy to allow inserting own profile row if it doesn't exist yet
DROP POLICY IF EXISTS "Profiles can insert own record" ON public.profiles;
CREATE POLICY "Profiles can insert own record" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
