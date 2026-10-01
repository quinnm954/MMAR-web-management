CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS bot_status text,
  ADD COLUMN IF NOT EXISTS bot_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bot_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.bot_confirm_booking_request(_id uuid, _date date, _time time)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_req public.booking_requests;
  v_customer_id uuid;
  v_appt uuid;
  v_email text; v_phone text;
  v_window text;
  v_at timestamptz;
BEGIN
  IF _time < time '10:00' OR _time > time '17:00' THEN
    RAISE EXCEPTION 'Time must be between 10:00 and 17:00';
  END IF;
  v_at := (_date + _time) AT TIME ZONE 'America/New_York';
  IF v_at <= now() THEN RAISE EXCEPTION 'Time is in the past'; END IF;
  v_window := to_char(_time, 'FMHH12:MI AM');

  SELECT * INTO v_req FROM public.booking_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking request not found'; END IF;
  IF v_req.converted_appointment_id IS NOT NULL THEN
    UPDATE public.appointments SET requested_date=_date, requested_time_window=v_window, scheduled_at=v_at, status='confirmed', updated_at=now()
     WHERE id = v_req.converted_appointment_id;
    UPDATE public.booking_requests SET requested_date=_date, requested_time_window=v_window, status='converted', bot_status='confirmed', bot_updated_at=now(), updated_at=now() WHERE id=_id;
    RETURN jsonb_build_object('appointment_id', v_req.converted_appointment_id, 'reused', true);
  END IF;

  v_email := lower(trim(COALESCE(v_req.customer_email,'')));
  v_phone := trim(COALESCE(v_req.customer_phone,''));
  IF v_email <> '' THEN SELECT id INTO v_customer_id FROM public.profiles WHERE lower(email)=v_email LIMIT 1; END IF;
  IF v_customer_id IS NULL AND v_phone <> '' THEN SELECT id INTO v_customer_id FROM public.profiles WHERE phone=v_phone LIMIT 1; END IF;
  IF v_customer_id IS NULL THEN
    v_customer_id := gen_random_uuid();
    INSERT INTO public.profiles (id,email,full_name,phone)
    VALUES (v_customer_id, NULLIF(v_email,''), NULLIF(trim(COALESCE(v_req.customer_name,'')),''), NULLIF(v_phone,''));
  END IF;

  INSERT INTO public.appointments (customer_id, service_type, description, requested_date, requested_time_window, scheduled_at, service_address, status, source, technician_notes, board_column)
  VALUES (v_customer_id, COALESCE(v_req.service_type,'Service request'), v_req.description, _date, v_window, v_at, v_req.service_address, 'confirmed', COALESCE(v_req.source,'website_booking'), v_req.notes, 'scheduled')
  RETURNING id INTO v_appt;

  UPDATE public.booking_requests SET requested_date=_date, requested_time_window=v_window, status='converted', converted_appointment_id=v_appt, bot_status='confirmed', bot_updated_at=now(), updated_at=now() WHERE id=_id;
  RETURN jsonb_build_object('appointment_id', v_appt, 'customer_id', v_customer_id, 'reused', false);
END; $$;
REVOKE ALL ON FUNCTION public.bot_confirm_booking_request(uuid, date, time) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bot_confirm_booking_request(uuid, date, time) TO service_role;

CREATE OR REPLACE FUNCTION public.start_booking_bot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF COALESCE(NEW.source,'') = 'ai_phone' OR COALESCE(trim(NEW.customer_phone),'') IN ('','unknown') THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/booking-bot?action=start',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc"}'::jsonb,
    body := jsonb_build_object('id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_start_booking_bot ON public.booking_requests;
CREATE TRIGGER trg_start_booking_bot AFTER INSERT ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.start_booking_bot();