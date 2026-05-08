
CREATE OR REPLACE FUNCTION public.get_estimate_by_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_est public.estimates;
  v_customer jsonb;
  v_vehicle jsonb;
BEGIN
  SELECT * INTO v_est FROM public.estimates WHERE approval_token = _token LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(p) - 'phone' INTO v_customer
    FROM (SELECT full_name, email FROM public.profiles WHERE id = v_est.customer_id) p;

  IF v_est.vehicle_id IS NOT NULL THEN
    SELECT to_jsonb(v) INTO v_vehicle
      FROM (SELECT year, make, model, license_plate, vin FROM public.vehicles WHERE id = v_est.vehicle_id) v;
  END IF;

  RETURN jsonb_build_object(
    'estimate', to_jsonb(v_est),
    'customer', v_customer,
    'vehicle', v_vehicle
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_estimate_by_token(text) TO anon, authenticated;

-- Allow signing/approving via the public token even when not logged in as the customer.
CREATE OR REPLACE FUNCTION public.submit_estimate_decision(
  _token text,
  _line_items jsonb,
  _status text,
  _signature text,
  _decline_reason text
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

  RETURN jsonb_build_object('id', v_est.id, 'status', _status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_estimate_decision(text, jsonb, text, text, text) TO anon, authenticated;
