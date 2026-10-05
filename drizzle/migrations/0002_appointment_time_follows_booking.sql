CREATE OR REPLACE FUNCTION public.fill_appointment_scheduled_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.requested_date IS NOT NULL AND COALESCE(NEW.status,'') NOT IN ('cancelled','canceled','declined') AND (
       NEW.scheduled_at IS NULL
       OR (TG_OP = 'UPDATE' AND NEW.scheduled_at IS NOT DISTINCT FROM OLD.scheduled_at
           AND (NEW.requested_date IS DISTINCT FROM OLD.requested_date OR NEW.requested_time_window IS DISTINCT FROM OLD.requested_time_window))
     ) THEN
    NEW.scheduled_at := (NEW.requested_date + public.window_start_time(NEW.requested_time_window)) AT TIME ZONE 'America/New_York';
  END IF;
  RETURN NEW;
END; $$;