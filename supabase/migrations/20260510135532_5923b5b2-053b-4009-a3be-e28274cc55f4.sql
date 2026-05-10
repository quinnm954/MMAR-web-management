-- Allow 'confirmed' status on booking requests
ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_status_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('new','contacted','confirmed','converted','declined','spam'));

-- Admin RPC: confirm a booking request (with optional adjusted date/window)
CREATE OR REPLACE FUNCTION public.admin_confirm_booking_request(
  _id uuid,
  _requested_date date DEFAULT NULL,
  _requested_time_window text DEFAULT NULL,
  _notes text DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_req public.booking_requests;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_req FROM public.booking_requests WHERE id = _id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found';
  END IF;

  UPDATE public.booking_requests
     SET status = 'confirmed',
         requested_date = COALESCE(_requested_date, requested_date),
         requested_time_window = COALESCE(NULLIF(trim(COALESCE(_requested_time_window,'')), ''), requested_time_window),
         notes = COALESCE(NULLIF(trim(COALESCE(_notes,'')), ''), notes),
         updated_at = now()
   WHERE id = _id;

  RETURN jsonb_build_object('id', _id, 'status', 'confirmed');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_confirm_booking_request(uuid, date, text, text) TO authenticated;

-- Admin RPC: decline a booking request
CREATE OR REPLACE FUNCTION public.admin_decline_booking_request(
  _id uuid,
  _reason text DEFAULT NULL
) RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.booking_requests
     SET status = 'declined',
         notes = COALESCE(NULLIF(trim(COALESCE(_reason,'')), ''), notes),
         updated_at = now()
   WHERE id = _id;
  RETURN jsonb_build_object('id', _id, 'status', 'declined');
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_decline_booking_request(uuid, text) TO authenticated;