-- Start migration transaction
BEGIN;

-- 1. Drop self-promotion RPC function
DROP FUNCTION IF EXISTS public.make_user_admin(uuid);

-- 2. Create trigger to enforce that ONLY ataherrizon@gmail.com is admin
CREATE OR REPLACE FUNCTION public.enforce_super_admin_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'ataherrizon@gmail.com' THEN
    NEW.role := 'admin';
  ELSE
    NEW.role := 'student';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_super_admin_role ON public.profiles;
CREATE TRIGGER tr_enforce_super_admin_role
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_super_admin_role();

-- 3. Correct roles of existing database records
UPDATE public.profiles
SET role = CASE WHEN email = 'ataherrizon@gmail.com' THEN 'admin' ELSE 'student' END;

-- 4. Refactor RLS policies to strictly bind admin operations to JWT email validation
-- Payment Requests Policies
DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;
CREATE POLICY "Admins can manage all payment requests" ON public.payment_requests
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- Payment Transactions Policies
DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can manage all payment transactions" ON public.payment_transactions
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- User Subscriptions Policies
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- Subscription History Policies
DROP POLICY IF EXISTS "Admins can view all subscription history" ON public.subscription_history;
CREATE POLICY "Admins can view all subscription history" ON public.subscription_history
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- Profiles Admin update bypass policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- Announcements Admin policies
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- Feedback Admin policies
DROP POLICY IF EXISTS "Admins can read all feedback" ON public.feedback;
CREATE POLICY "Admins can read all feedback" ON public.feedback
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

COMMIT;
