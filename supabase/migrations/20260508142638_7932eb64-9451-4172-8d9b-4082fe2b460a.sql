
CREATE OR REPLACE FUNCTION public.submit_estimate_decision(
  _token text,
  _line_items jsonb,
  _status text,
  _signature text,
  _decline_reason text,
  _requested_date date DEFAULT NULL,
  _requested_time_window text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_est public.estimates;
BEGIN
  SELECT * INTO v_est FROM public.estimates WHERE approval_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estimate not found';
  END IF;
  IF v_est.status NOT IN ('sent','draft') THEN
    RAISE EXCEPTION 'Estimate already %', v_est.status;
  END IF;
  IF _status NOT IN ('approved','partially_approved','declined') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE public.estimates
     SET line_items = _line_items,
         signature_image = _signature,
         signed_at = now(),
         status = _status,
         approved_at = CASE WHEN _status IN ('approved','partially_approved') THEN now() ELSE approved_at END,
         declined_at = CASE WHEN _status = 'declined' THEN now() ELSE declined_at END,
         decline_reason = _decline_reason,
         updated_at = now()
   WHERE id = v_est.id;

  IF _status IN ('approved','partially_approved')
     AND v_est.appointment_id IS NOT NULL
     AND _requested_date IS NOT NULL THEN
    UPDATE public.appointments
       SET requested_date = _requested_date,
           requested_time_window = COALESCE(_requested_time_window, requested_time_window),
           updated_at = now()
     WHERE id = v_est.appointment_id;
  END IF;

  RETURN jsonb_build_object('id', v_est.id, 'status', _status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_estimate_decision(text, jsonb, text, text, text, date, text) TO anon, authenticated;
