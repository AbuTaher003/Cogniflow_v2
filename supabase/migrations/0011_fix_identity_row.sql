-- Fix: GoTrue requires a matching row in auth.identities for signInWithPassword to work.
-- The create_developer_user function was only inserting into auth.users but not auth.identities,
-- causing "Invalid login credentials" errors despite correct password.
-- NOTE: auth.identities.email is a GENERATED column from identity_data->>'email', do NOT insert it.

-- Fix the broken user freshtest_june15_a@example.com by adding its missing identity row.
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'freshtest_june15_a@example.com';
  IF uid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = uid) THEN
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      uid::text,
      uid,
      jsonb_build_object('sub', uid::text, 'email', 'freshtest_june15_a@example.com', 'email_verified', true, 'phone_verified', false),
      'email',
      now(),
      now(),
      now()
    );
  END IF;
END;
$$;

-- Auto-confirm all existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Now fix the create_developer_user function to also insert into auth.identities
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

  new_user_id := gen_random_uuid();
  hashed_password := crypt(user_password, gen_salt('bf', 10));

  -- Insert into auth.users (without confirmed_at which is generated)
  INSERT INTO auth.users (
    id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    created_at, updated_at, is_sso_user, is_anonymous
  ) VALUES (
    new_user_id, 'authenticated', 'authenticated', user_email, hashed_password, now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, false,
    now(), now(), false, false
  );

  -- Insert into auth.identities (without email which is generated from identity_data->>'email')
  INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    new_user_id::text, new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email, 'email_verified', true, 'phone_verified', false),
    'email',
    now(), now(), now()
  );

  RETURN new_user_id;
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION public.create_developer_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_developer_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_user(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_user(text) TO authenticated;
