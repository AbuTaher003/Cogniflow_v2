-- 1. Create public.ai_requests table if it does not exist
CREATE TABLE IF NOT EXISTS public.ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on ai_requests
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_requests
DROP POLICY IF EXISTS "Users can insert their own AI requests" ON public.ai_requests;
CREATE POLICY "Users can insert their own AI requests"
  ON public.ai_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all AI requests" ON public.ai_requests;
CREATE POLICY "Admins can view all AI requests"
  ON public.ai_requests FOR SELECT
  USING (auth.jwt() ->> 'email' = 'ataherrizon@gmail.com');

-- 2. Enhance public.payment_transactions with status column
ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS status text CHECK (status in ('approved', 'rejected'));

-- Update trigger function for payment approval to handle status column
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_dur integer;
  sub_expires timestamptz;
BEGIN
  -- Only execute if status transitioned to approved
  IF (OLD.status != 'approved' AND NEW.status = 'approved') THEN
    -- Retrieve plan duration
    SELECT duration_days INTO plan_dur
    FROM public.subscription_plans
    WHERE id = NEW.plan_id;

    -- Calculate expiry timestamp
    IF (plan_dur IS NOT NULL AND plan_dur > 0) THEN
      sub_expires := now() + (plan_dur || ' days')::interval;
    ELSE
      sub_expires := null;
    END IF;

    -- Create or update active subscription
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at)
    VALUES (NEW.user_id, NEW.plan_id, 'active', now(), sub_expires)
    ON CONFLICT (user_id)
    DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = now();

    -- Generate payment transaction receipt
    INSERT INTO public.payment_transactions (payment_request_id, approved_by, approved_at, status, notes)
    VALUES (
      NEW.id,
      auth.uid(),
      now(),
      'approved',
      'Payment request approved by admin. Subscription activated.'
    )
    ON CONFLICT (payment_request_id) 
    DO UPDATE SET 
      status = 'approved',
      approved_by = EXCLUDED.approved_by,
      approved_at = now(),
      notes = EXCLUDED.notes;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Enhance public.subscription_history table with transition_type, notes, plan_id columns
ALTER TABLE public.subscription_history 
  ADD COLUMN IF NOT EXISTS transition_type text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL;

-- Update trigger function handle_subscription_history_log to populate new columns
CREATE OR REPLACE FUNCTION public.handle_subscription_history_log()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_plan_slug text;
  old_plan_slug text;
  trans_type text;
  audit_notes text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT slug INTO new_plan_slug FROM public.subscription_plans WHERE id = NEW.plan_id;
    trans_type := 'activation';
    audit_notes := 'Subscription activated for plan: ' || upper(coalesce(new_plan_slug, 'unknown'));
    INSERT INTO public.subscription_history (user_id, previous_plan, current_plan, action, transition_type, notes, plan_id)
    VALUES (NEW.user_id, NULL, new_plan_slug, 'activation', trans_type, audit_notes, NEW.plan_id);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.plan_id != NEW.plan_id OR OLD.status != NEW.status THEN
      SELECT slug INTO old_plan_slug FROM public.subscription_plans WHERE id = OLD.plan_id;
      SELECT slug INTO new_plan_slug FROM public.subscription_plans WHERE id = NEW.plan_id;
      
      IF OLD.plan_id != NEW.plan_id THEN
        IF NEW.status = 'expired' OR new_plan_slug = 'free' THEN
          trans_type := 'downgrade';
          audit_notes := 'Subscription downgraded from ' || upper(coalesce(old_plan_slug, 'unknown')) || ' to ' || upper(coalesce(new_plan_slug, 'free'));
        ELSE
          trans_type := 'upgrade';
          audit_notes := 'Subscription upgraded from ' || upper(coalesce(old_plan_slug, 'unknown')) || ' to ' || upper(coalesce(new_plan_slug, 'unknown'));
        END IF;
      ELSIF OLD.status != NEW.status THEN
        trans_type := 'status_change';
        audit_notes := 'Subscription status updated from ' || OLD.status || ' to ' || NEW.status;
      END IF;
      
      INSERT INTO public.subscription_history (user_id, previous_plan, current_plan, action, transition_type, notes, plan_id)
      VALUES (NEW.user_id, old_plan_slug, new_plan_slug, 'plan_change', trans_type, audit_notes, NEW.plan_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Super Admin Metrics Aggregate Function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_admin_email text;
  result json;
  total_rev numeric(10,2);
  monthly_rev numeric(10,2);
  daily_rev numeric(10,2);
  pending_rev numeric(10,2);
  growth_pct numeric(5,2);
  prev_month_rev numeric(10,2);
  plan_revs json;
  total_users integer;
  active_users integer;
  free_users integer;
  pro_users integer;
  elite_users integer;
  premium_users integer;
  total_subs integer;
  expired_subs integer;
  total_pays integer;
  pending_pays integer;
  approved_pays integer;
  rejected_pays integer;
  total_tasks integer;
  total_notes integer;
  total_sessions integer;
  total_resumes integer;
  total_ai_requests integer;
BEGIN
  -- Get the email of the calling user
  current_admin_email := auth.jwt() ->> 'email';

  -- Check if they are the admin
  IF current_admin_email IS NULL OR current_admin_email != 'ataherrizon@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied: You are not authorized to view admin metrics.';
  END IF;

  -- 1. Revenue Calculations
  SELECT coalesce(sum(amount), 0) INTO total_rev FROM public.payment_requests WHERE status = 'approved';
  SELECT coalesce(sum(amount), 0) INTO monthly_rev FROM public.payment_requests WHERE status = 'approved' AND created_at >= date_trunc('month', now());
  SELECT coalesce(sum(amount), 0) INTO daily_rev FROM public.payment_requests WHERE status = 'approved' AND created_at >= date_trunc('day', now());
  SELECT coalesce(sum(amount), 0) INTO pending_rev FROM public.payment_requests WHERE status = 'pending';

  -- Calculate growth comparing this month to previous month
  SELECT coalesce(sum(amount), 0) INTO prev_month_rev 
  FROM public.payment_requests 
  WHERE status = 'approved' 
    AND created_at >= date_trunc('month', now() - interval '1 month') 
    AND created_at < date_trunc('month', now());

  IF prev_month_rev > 0 THEN
    growth_pct := ((monthly_rev - prev_month_rev) / prev_month_rev) * 100;
  ELSE
    growth_pct := 0;
  END IF;

  -- Plan breakdown of revenue
  SELECT coalesce(json_object_agg(plan_slug, total_amt), '{}'::json) INTO plan_revs
  FROM (
    SELECT sp.slug as plan_slug, sum(pr.amount) as total_amt
    FROM public.payment_requests pr
    JOIN public.subscription_plans sp ON pr.plan_id = sp.id
    WHERE pr.status = 'approved'
    GROUP BY sp.slug
  ) t;

  -- 2. User Metrics
  SELECT count(*) INTO total_users FROM public.profiles;
  SELECT count(distinct id) INTO active_users FROM public.profiles WHERE updated_at >= now() - interval '30 days';
  
  -- FREE, PRO, ELITE counts
  SELECT count(*) INTO free_users FROM public.profiles p 
  LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
  LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.id IS NULL OR us.status = 'expired' OR us.status = 'cancelled' OR sp.slug = 'free';

  SELECT count(*) INTO pro_users FROM public.profiles p 
  JOIN public.user_subscriptions us ON p.id = us.user_id
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.status = 'active' AND sp.slug = 'pro';

  SELECT count(*) INTO elite_users FROM public.profiles p 
  JOIN public.user_subscriptions us ON p.id = us.user_id
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.status = 'active' AND sp.slug = 'elite';

  SELECT count(*) INTO premium_users FROM public.profiles p 
  JOIN public.user_subscriptions us ON p.id = us.user_id
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.status = 'active' AND sp.slug = 'premium';

  -- 3. Subscription counts
  SELECT count(*) INTO total_subs FROM public.user_subscriptions WHERE status = 'active';
  SELECT count(*) INTO expired_subs FROM public.user_subscriptions WHERE status = 'expired';

  -- 4. Payment request counts
  SELECT count(*) INTO total_pays FROM public.payment_requests;
  SELECT count(*) INTO pending_pays FROM public.payment_requests WHERE status = 'pending';
  SELECT count(*) INTO approved_pays FROM public.payment_requests WHERE status = 'approved';
  SELECT count(*) INTO rejected_pays FROM public.payment_requests WHERE status = 'rejected';

  -- 5. Platform totals
  SELECT count(*) INTO total_tasks FROM public.tasks;
  SELECT count(*) INTO total_notes FROM public.notes;
  SELECT count(*) INTO total_sessions FROM public.focus_sessions;
  SELECT count(*) INTO total_resumes FROM public.resumes;
  SELECT count(*) INTO total_ai_requests FROM public.ai_requests;

  -- Build the JSON response
  SELECT json_build_object(
    'total_revenue', total_rev,
    'monthly_revenue', monthly_rev,
    'daily_revenue', daily_rev,
    'pending_revenue', pending_rev,
    'revenue_growth_pct', growth_pct,
    'revenue_by_plan', plan_revs,
    'total_users', total_users,
    'active_users', active_users,
    'free_users', free_users,
    'pro_users', pro_users,
    'elite_users', elite_users,
    'premium_users', premium_users,
    'total_subscriptions', total_subs,
    'expired_subscriptions', expired_subs,
    'total_payments', total_pays,
    'pending_payments', pending_pays,
    'approved_payments', approved_pays,
    'rejected_payments', rejected_pays,
    'total_tasks', total_tasks,
    'total_notes', total_notes,
    'total_sessions', total_sessions,
    'total_resumes', total_resumes,
    'total_ai_requests', total_ai_requests
  ) INTO result;

  RETURN result;
END;
$$;

-- 5. Create Super Admin User Fetcher Function
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  xp integer,
  level integer,
  last_sign_in_at timestamptz,
  plan_name text,
  plan_slug text,
  subscription_status text,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if they are admin
  IF auth.jwt() ->> 'email' != 'ataherrizon@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    p.updated_at,
    p.xp,
    p.level,
    u.last_sign_in_at,
    coalesce(sp.name, 'FREE') as plan_name,
    coalesce(sp.slug, 'free') as plan_slug,
    coalesce(us.status, 'expired') as subscription_status,
    us.expires_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
  LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
  ORDER BY p.created_at DESC;
END;
$$;

-- 6. Create Super Admin Activity Fetcher Function
CREATE OR REPLACE FUNCTION public.get_user_activities(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF auth.jwt() ->> 'email' != 'ataherrizon@gmail.com' THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  SELECT json_build_object(
    'focus_sessions', (
      SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT f.id, f.session_type, f.duration_minutes, f.score, f.completed_at, f.created_at
        FROM public.focus_sessions f
        WHERE f.user_id = target_user_id
        ORDER BY f.created_at DESC
        LIMIT 20
      ) t
    ),
    'tasks', (
      SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT tk.id, tk.title, tk.status, tk.priority, tk.due_date, tk.created_at
        FROM public.tasks tk
        WHERE tk.user_id = target_user_id
        ORDER BY tk.created_at DESC
        LIMIT 20
      ) t
    ),
    'notes', (
      SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT n.id, n.title, n.format, n.created_at, n.updated_at
        FROM public.notes n
        WHERE n.user_id = target_user_id
        ORDER BY n.updated_at DESC
        LIMIT 20
      ) t
    ),
    'resumes', (
      SELECT coalesce(json_agg(t), '[]'::json) FROM (
        SELECT r.id, r.title, r.template, r.created_at
        FROM public.resumes r
        WHERE r.user_id = target_user_id
        ORDER BY r.created_at DESC
        LIMIT 20
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
