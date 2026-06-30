-- Create the get_active_announcements function to query active announcements and dynamic read markers
CREATE OR REPLACE FUNCTION public.get_active_announcements()
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  type text,
  priority text,
  created_by uuid,
  created_at timestamptz,
  expires_at timestamptz,
  is_active boolean,
  read boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.content,
    a.type,
    a.priority,
    a.created_by,
    a.created_at,
    a.expires_at,
    a.is_active,
    EXISTS (
      SELECT 1 FROM public.user_announcements_read r
      WHERE r.announcement_id = a.id AND r.user_id = auth.uid()
    ) AS read
  FROM public.announcements a
  WHERE a.is_active = true 
    AND (a.expires_at IS NULL OR a.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated and anon user roles
GRANT EXECUTE ON FUNCTION public.get_active_announcements() TO authenticated, anon;
