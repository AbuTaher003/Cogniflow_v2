-- 1. Create Trigger Function to Distribute Announcements to Notifications
CREATE OR REPLACE FUNCTION public.distribute_announcement_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Distribute when inserted as active or updated from inactive to active
  IF (TG_OP = 'INSERT' AND NEW.is_active = TRUE) OR 
     (TG_OP = 'UPDATE' AND NEW.is_active = TRUE AND OLD.is_active = FALSE) THEN
     
    FOR user_rec IN SELECT id FROM public.profiles LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = user_rec.id AND (data->>'announcement_id') = NEW.id::text
      ) THEN
        INSERT INTO public.notifications (user_id, type, title, message, read, data, created_at)
        VALUES (
          user_rec.id,
          'system',
          NEW.title,
          NEW.content,
          FALSE,
          json_build_object('announcement_id', NEW.id, 'priority', NEW.priority, 'type', NEW.type),
          NEW.created_at
        );
      END IF;
    END LOOP;
    
  -- Remove notifications when deactivated
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    DELETE FROM public.notifications 
    WHERE (data->>'announcement_id') = NEW.id::text;
    
  -- Update existing notifications if title or content changes
  ELSIF TG_OP = 'UPDATE' AND NEW.is_active = TRUE AND OLD.is_active = TRUE THEN
    UPDATE public.notifications
    SET 
      title = NEW.title,
      message = NEW.content,
      data = json_build_object('announcement_id', NEW.id, 'priority', NEW.priority, 'type', NEW.type)
    WHERE (data->>'announcement_id') = NEW.id::text;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on public.announcements
DROP TRIGGER IF EXISTS trg_distribute_announcement_notification ON public.announcements;
CREATE TRIGGER trg_distribute_announcement_notification
AFTER INSERT OR UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.distribute_announcement_notification();

-- 2. Create Trigger Function to Cleanup Notifications on Delete
CREATE OR REPLACE FUNCTION public.cleanup_announcement_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE (data->>'announcement_id') = OLD.id::text;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on public.announcements for Delete
DROP TRIGGER IF EXISTS trg_cleanup_announcement_notification ON public.announcements;
CREATE TRIGGER trg_cleanup_announcement_notification
AFTER DELETE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_announcement_notification();

-- 3. Create Trigger Function to Assign Announcements to New Registered Users
CREATE OR REPLACE FUNCTION public.assign_active_announcements_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  ann_rec RECORD;
BEGIN
  FOR ann_rec IN 
    SELECT id, title, content, priority, type, created_at 
    FROM public.announcements 
    WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > now())
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = NEW.id AND (data->>'announcement_id') = ann_rec.id::text
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, message, read, data, created_at)
      VALUES (
        NEW.id,
        'system',
        ann_rec.title,
        ann_rec.content,
        FALSE,
        json_build_object('announcement_id', ann_rec.id, 'priority', ann_rec.priority, 'type', ann_rec.type),
        ann_rec.created_at
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on public.profiles for new users
DROP TRIGGER IF EXISTS trg_assign_active_announcements_to_new_user ON public.profiles;
CREATE TRIGGER trg_assign_active_announcements_to_new_user
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_active_announcements_to_new_user();

-- 4. Backfill existing active announcements to all profiles immediately
DO $$
DECLARE
  ann_rec RECORD;
  user_rec RECORD;
BEGIN
  FOR ann_rec IN 
    SELECT id, title, content, priority, type, created_at 
    FROM public.announcements 
    WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > now())
  LOOP
    FOR user_rec IN SELECT id FROM public.profiles LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = user_rec.id AND (data->>'announcement_id') = ann_rec.id::text
      ) THEN
        INSERT INTO public.notifications (user_id, type, title, message, read, data, created_at)
        VALUES (
          user_rec.id,
          'system',
          ann_rec.title,
          ann_rec.content,
          FALSE,
          json_build_object('announcement_id', ann_rec.id, 'priority', ann_rec.priority, 'type', ann_rec.type),
          ann_rec.created_at
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
