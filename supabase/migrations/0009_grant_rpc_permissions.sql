-- Grant execute permissions on RPC functions to anon and authenticated roles.
-- Without these grants, client-side RPC calls via the anon key silently fail.

GRANT EXECUTE ON FUNCTION public.confirm_user(text) TO anon;
GRANT EXECUTE ON FUNCTION public.confirm_user(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_developer_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_developer_user(text, text) TO authenticated;
