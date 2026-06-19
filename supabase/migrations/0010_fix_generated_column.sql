-- Fix: confirmed_at is a generated column in auth.users on hosted Supabase.
-- We cannot INSERT or UPDATE it directly. Only email_confirmed_at can be set.

CREATE OR REPLACE FUNCTION public.confirm_user(email_to_confirm text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  u_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO u_id FROM auth.users WHERE email = email_to_confirm;

  IF u_id IS NOT NULL THEN
    -- Update email_confirmed_at on auth.users
    UPDATE auth.users
    SET email_confirmed_at = now(),
        updated_at = now()
    WHERE id = u_id;

    -- Update email_verified inside identity_data on auth.identities
    UPDATE auth.identities
    SET identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email_verified}', 'true'::jsonb),
        updated_at = now()
    WHERE user_id = u_id;
  END IF;
END;
$$;

-- Fix create_developer_user: remove confirmed_at from the INSERT
CREATE OR REPLACE FUNCTION public.create_developer_user(
  user_email text,
  user_password text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
  hashed_password text;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  IF new_user_id IS NOT NULL THEN
    RETURN new_user_id;
  END IF;

  -- Generate new ID
  new_user_id := gen_random_uuid();
  
  -- Hash password using bcrypt via pgcrypto
  hashed_password := crypt(user_password, gen_salt('bf', 10));

  -- Insert into auth.users as fully confirmed (without confirmed_at which is generated)
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  ) VALUES (
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    hashed_password,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    now(),
    now(),
    false,
    false
  );

  RETURN new_user_id;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.confirm_user(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_user(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_developer_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_developer_user(text, text) TO authenticated;
