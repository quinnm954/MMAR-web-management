
CREATE TABLE IF NOT EXISTS public.estimate_decision_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL,
  status text NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature_image text,
  decline_reason text,
  requested_date date,
  requested_time_window text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estimate_decision_logs_estimate_id
  ON public.estimate_decision_logs(estimate_id, created_at DESC);

ALTER TABLE public.estimate_decision_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view decision logs" ON public.estimate_decision_logs;
CREATE POLICY "Admins view decision logs"
  ON public.estimate_decision_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Customers view own decision logs" ON public.estimate_decision_logs;
CREATE POLICY "Customers view own decision logs"
  ON public.estimate_decision_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.id = estimate_decision_logs.estimate_id
      AND e.customer_id = auth.uid()
  ));

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
  IF _status NOT IN ('approved','partially_approved','declined') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

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

-- Expose decision log via the public token RPC so customers can see their history without auth
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
  v_logs jsonb;
BEGIN
  SELECT * INTO v_est FROM public.estimates WHERE approval_token = _token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT to_jsonb(p) INTO v_customer
    FROM (SELECT full_name, email FROM public.profiles WHERE id = v_est.customer_id) p;

  IF v_est.vehicle_id IS NOT NULL THEN
    SELECT to_jsonb(v) INTO v_vehicle
      FROM (SELECT year, make, model, license_plate, vin FROM public.vehicles WHERE id = v_est.vehicle_id) v;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC), '[]'::jsonb) INTO v_logs
    FROM (SELECT id, status, decline_reason, requested_date, requested_time_window, created_at
            FROM public.estimate_decision_logs
           WHERE estimate_id = v_est.id) l;

  RETURN jsonb_build_object(
    'estimate', to_jsonb(v_est),
    'customer', v_customer,
    'vehicle', v_vehicle,
    'decision_logs', v_logs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_estimate_by_token(text) TO anon, authenticated;
