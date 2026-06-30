-- Update trigger function to validate payment amount only on INSERT or when amount/plan is modified on UPDATE
CREATE OR REPLACE FUNCTION public.validate_payment_request()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_slug text;
BEGIN
  -- Only validate when creating a request or changing amount/plan
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (NEW.amount IS DISTINCT FROM OLD.amount OR NEW.plan_id IS DISTINCT FROM OLD.plan_id))) THEN
    SELECT slug INTO plan_slug
    FROM public.subscription_plans
    WHERE id = NEW.plan_id;

    IF (plan_slug = 'pro') THEN
      IF (NEW.amount <> 400.00) THEN
        RAISE EXCEPTION 'Invalid payment amount. PRO subscription requires exactly ৳400.';
      END IF;
    ELSIF (plan_slug = 'elite') THEN
      IF (NEW.amount <> 1000.00) THEN
        RAISE EXCEPTION 'Invalid payment amount. ELITE subscription requires exactly ৳1000.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
