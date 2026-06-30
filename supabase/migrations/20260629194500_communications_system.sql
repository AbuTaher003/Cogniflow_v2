-- Drop old tables CASCADE to ensure clean definitions
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.user_announcements_read CASCADE;

-- Create feedback table
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Pending',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_category_check CHECK (category IN ('Bug Report', 'Feature Request', 'UI/UX', 'Payment Issue', 'Subscription Issue', 'General Feedback')),
  CONSTRAINT feedback_status_check CHECK (status IN ('Pending', 'Reviewed', 'Resolved', 'Closed')),
  CONSTRAINT feedback_priority_check CHECK (priority IN ('Low', 'Medium', 'High'))
);

-- Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'General',
  priority text NOT NULL DEFAULT 'Medium',
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT announcements_type_check CHECK (type IN ('General', 'Update', 'Maintenance', 'Billing', 'Feature Release', 'Emergency')),
  CONSTRAINT announcements_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'))
);

-- Create user_announcements_read table
CREATE TABLE public.user_announcements_read (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON public.announcements(expires_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_announcements_read ENABLE ROW LEVEL SECURITY;

-- Feedback RLS Policies
CREATE POLICY "Users can create own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback" ON public.feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Announcements RLS Policies
CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT USING (
    is_active = true AND (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Super admins can manage all announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.email = 'ataherrizon@gmail.com'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.email = 'ataherrizon@gmail.com'
    )
  );

-- User Announcements Read tracking RLS Policies
CREATE POLICY "Users can manage own read markers" ON public.user_announcements_read
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
