CREATE OR REPLACE FUNCTION public.submit_estimate_decision(
  _token text,
  _line_items jsonb,
  _status text,
  _signature text,
  _decline_reason text,
  _requested_date date DEFAULT NULL,
  _requested_time_window text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_est public.estimates;
  v_was_approved boolean;
BEGIN
  SELECT * INTO v_est FROM public.estimates WHERE approval_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estimate not found';
  END IF;
  IF _status NOT IN ('approved','partially_approved','declined') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  v_was_approved := v_est.status IN ('approved','partially_approved');

  -- Always log the decision (revisions included)
  INSERT INTO public.estimate_decision_logs(
    estimate_id, status, line_items, signature_image, decline_reason,
    requested_date, requested_time_window, actor_id
  ) VALUES (
    v_est.id, _status, _line_items, _signature, _decline_reason,
    _requested_date, _requested_time_window, auth.uid()
  );

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

  -- If newly declined and there was a linked repair order, clean up downstream records
  IF _status = 'declined' AND v_was_approved AND v_est.appointment_id IS NOT NULL THEN
    -- Delete invoices generated from service records on this appointment
    DELETE FROM public.invoices
     WHERE service_record_id IN (
       SELECT id FROM public.service_records WHERE appointment_id = v_est.appointment_id
     );
    -- Delete those service records
    DELETE FROM public.service_records WHERE appointment_id = v_est.appointment_id;
    -- Delete the repair order (appointment) itself
    DELETE FROM public.appointments WHERE id = v_est.appointment_id;
    -- Detach the estimate from the now-deleted appointment
    UPDATE public.estimates SET appointment_id = NULL WHERE id = v_est.id;
  END IF;

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
$function$;