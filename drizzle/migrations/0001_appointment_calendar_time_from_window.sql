CREATE OR REPLACE FUNCTION public.window_start_time(_w text)
RETURNS time LANGUAGE plpgsql IMMUTABLE SET search_path TO 'public' AS $$
DECLARE m text[]; h int; mi int;
BEGIN
  IF _w IS NULL OR trim(_w) = '' THEN RETURN time '10:00'; END IF;
  m := regexp_match(lower(_w), '(\d{1,2})(?::(\d{2}))?\s*(am|pm)');
  IF m IS NOT NULL THEN
    h := m[1]::int; mi := COALESCE(m[2], '0')::int;
    IF m[3] = 'pm' AND h < 12 THEN h := h + 12; END IF;
    IF m[3] = 'am' AND h = 12 THEN h := 0; END IF;
    RETURN make_time(GREATEST(LEAST(h, 17), 10), CASE WHEN h BETWEEN 10 AND 16 THEN mi ELSE 0 END, 0);
  END IF;
  IF lower(_w) LIKE '%late%' THEN RETURN time '15:00'; END IF;
  IF lower(_w) LIKE '%afternoon%' OR lower(_w) LIKE '%evening%' THEN RETURN time '13:00'; END IF;
  RETURN time '10:30';
END; $$;

CREATE OR REPLACE FUNCTION public.fill_appointment_scheduled_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.scheduled_at IS NULL AND NEW.requested_date IS NOT NULL
     AND COALESCE(NEW.status,'') NOT IN ('cancelled','canceled','declined') THEN
    NEW.scheduled_at := (NEW.requested_date + public.window_start_time(NEW.requested_time_window)) AT TIME ZONE 'America/New_York';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_fill_appointment_scheduled_at ON public.appointments;
CREATE TRIGGER trg_fill_appointment_scheduled_at BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.fill_appointment_scheduled_at();