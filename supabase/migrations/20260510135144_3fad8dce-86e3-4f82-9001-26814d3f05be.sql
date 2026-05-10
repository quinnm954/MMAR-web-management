-- 1) Extend appointments with source + public confirmation token
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS confirmation_token text;

-- Constrain source values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_source_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_source_check
      CHECK (source IN ('in_app','google','phone','sms','walk_in','other'));
  END IF;
END $$;

-- Backfill tokens for existing rows
UPDATE public.appointments
   SET confirmation_token = replace(gen_random_uuid()::text, '-', '')
 WHERE confirmation_token IS NULL;

ALTER TABLE public.appointments
  ALTER COLUMN confirmation_token SET NOT NULL,
  ALTER COLUMN confirmation_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS appointments_confirmation_token_key
  ON public.appointments (confirmation_token);

CREATE INDEX IF NOT EXISTS appointments_source_idx
  ON public.appointments (source);

-- 2) New booking_requests table for public/Google bookings (no auth required)
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  source text NOT NULL DEFAULT 'google'
    CHECK (source IN ('in_app','google','phone','sms','walk_in','other')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','converted','declined','spam')),
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  vehicle_info text,
  service_type text NOT NULL,
  description text,
  service_address text,
  requested_date date,
  requested_time_window text,
  notes text,
  converted_appointment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_requests_status_idx ON public.booking_requests (status);
CREATE INDEX IF NOT EXISTS booking_requests_source_idx ON public.booking_requests (source);

DROP TRIGGER IF EXISTS booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage booking requests" ON public.booking_requests;
CREATE POLICY "Admins manage booking requests"
  ON public.booking_requests
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Public RPC: submit a booking request (used by /book page)
CREATE OR REPLACE FUNCTION public.submit_booking_request(
  _name text,
  _phone text,
  _email text,
  _service_type text,
  _description text,
  _service_address text,
  _vehicle_info text,
  _requested_date date,
  _requested_time_window text,
  _source text
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_token text;
  v_id uuid;
  v_source text := COALESCE(NULLIF(_source, ''), 'google');
BEGIN
  IF _name IS NULL OR length(trim(_name)) < 2 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  IF _phone IS NULL OR length(regexp_replace(_phone, '\D', '', 'g')) < 7 THEN
    RAISE EXCEPTION 'A valid phone number is required';
  END IF;
  IF _service_type IS NULL OR length(trim(_service_type)) < 2 THEN
    RAISE EXCEPTION 'Service type is required';
  END IF;
  IF v_source NOT IN ('in_app','google','phone','sms','walk_in','other') THEN
    v_source := 'google';
  END IF;

  INSERT INTO public.booking_requests (
    customer_name, customer_phone, customer_email,
    service_type, description, service_address,
    vehicle_info, requested_date, requested_time_window, source
  ) VALUES (
    trim(_name), trim(_phone), NULLIF(trim(COALESCE(_email,'')), ''),
    trim(_service_type), NULLIF(trim(COALESCE(_description,'')), ''),
    NULLIF(trim(COALESCE(_service_address,'')), ''),
    NULLIF(trim(COALESCE(_vehicle_info,'')), ''),
    _requested_date, NULLIF(trim(COALESCE(_requested_time_window,'')), ''), v_source
  ) RETURNING id, confirmation_token INTO v_id, v_token;

  RETURN jsonb_build_object('id', v_id, 'token', v_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_booking_request(
  text, text, text, text, text, text, text, date, text, text
) TO anon, authenticated;

-- 4) Public RPC: look up a single appointment or booking request by token
CREATE OR REPLACE FUNCTION public.get_appointment_confirmation(_token text)
  RETURNS jsonb
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_appt public.appointments;
  v_req  public.booking_requests;
  v_vehicle text;
  v_customer text;
BEGIN
  SELECT * INTO v_appt FROM public.appointments WHERE confirmation_token = _token LIMIT 1;
  IF FOUND THEN
    SELECT (year::text || ' ' || COALESCE(make,'') || ' ' || COALESCE(model,''))
      INTO v_vehicle FROM public.vehicles WHERE id = v_appt.vehicle_id;
    SELECT full_name INTO v_customer FROM public.profiles WHERE id = v_appt.customer_id;
    RETURN jsonb_build_object(
      'kind', 'appointment',
      'id', v_appt.id,
      'token', v_appt.confirmation_token,
      'source', v_appt.source,
      'status', v_appt.status,
      'service_type', v_appt.service_type,
      'description', v_appt.description,
      'service_address', v_appt.service_address,
      'requested_date', v_appt.requested_date,
      'requested_time_window', v_appt.requested_time_window,
      'scheduled_at', v_appt.scheduled_at,
      'vehicle', v_vehicle,
      'customer_name', v_customer,
      'created_at', v_appt.created_at
    );
  END IF;

  SELECT * INTO v_req FROM public.booking_requests WHERE confirmation_token = _token LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'kind', 'booking_request',
      'id', v_req.id,
      'token', v_req.confirmation_token,
      'source', v_req.source,
      'status', v_req.status,
      'service_type', v_req.service_type,
      'description', v_req.description,
      'service_address', v_req.service_address,
      'requested_date', v_req.requested_date,
      'requested_time_window', v_req.requested_time_window,
      'vehicle', v_req.vehicle_info,
      'customer_name', v_req.customer_name,
      'customer_phone', v_req.customer_phone,
      'created_at', v_req.created_at
    );
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_appointment_confirmation(text) TO anon, authenticated;