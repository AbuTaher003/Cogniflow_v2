-- Create trigger function to validate payment amount based on subscription plan (EXACT match check)
CREATE OR REPLACE FUNCTION public.validate_payment_request()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_slug text;
BEGIN
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger before INSERT or UPDATE on payment_requests
DROP TRIGGER IF EXISTS tr_validate_payment_request ON public.payment_requests;
CREATE TRIGGER tr_validate_payment_request
  BEFORE INSERT OR UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_request();
