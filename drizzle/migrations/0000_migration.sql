CREATE OR REPLACE FUNCTION public.guard_bot_slot(_date date, _time time, _exclude uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_at timestamptz := (_date + _time) AT TIME ZONE 'America/New_York';
BEGIN
  IF v_at < now() + interval '60 minutes' THEN RAISE EXCEPTION 'Too soon to travel'; END IF;
  IF EXISTS (SELECT 1 FROM public.appointments WHERE scheduled_at IS NOT NULL
      AND id IS DISTINCT FROM _exclude
      AND status NOT IN ('cancelled','canceled','declined','no_show')
      AND abs(extract(epoch FROM scheduled_at - v_at)) < 7200) THEN
    RAISE EXCEPTION 'Slot already booked';
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.guard_bot_slot(date, time, uuid) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE src text;
BEGIN
  SELECT pg_get_functiondef('public.bot_confirm_booking_request(uuid,date,time)'::regprocedure) INTO src;
  src := replace(src, '  IF NOT FOUND THEN RAISE EXCEPTION ''Booking request not found''; END IF;',
    '  IF NOT FOUND THEN RAISE EXCEPTION ''Booking request not found''; END IF;
  PERFORM public.guard_bot_slot(_date, _time, v_req.converted_appointment_id);');
  EXECUTE src;
END $$;