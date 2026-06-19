-- Function to create a pre-confirmed user directly in auth.users bypassing GoTrue/SMTP
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

  -- Insert into auth.users as fully confirmed
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
    confirmed_at,
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
    now(),
    false,
    false
  );

  RETURN new_user_id;
END;
$$;
