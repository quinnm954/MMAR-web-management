CREATE OR REPLACE FUNCTION public.tech_finish_job(_appointment_id uuid, _mileage integer DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.appointments; v_inv uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO a FROM public.appointments WHERE id = _appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF NOT (a.assigned_technician_id = auth.uid() OR public.is_staff(auth.uid()) AND public.has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Not your job';
  END IF;
  IF a.status IN ('cancelled','canceled') THEN RAISE EXCEPTION 'Job was cancelled'; END IF;

  UPDATE public.appointments SET status = 'completed',
    technician_notes = CASE WHEN COALESCE(btrim(_note),'') = '' THEN technician_notes
      ELSE concat_ws(E'\n', NULLIF(technician_notes,''), 'Finished: ' || btrim(_note)) END
  WHERE id = _appointment_id;

  IF _mileage IS NOT NULL AND _mileage > 0 AND a.vehicle_id IS NOT NULL THEN
    INSERT INTO public.vehicle_mileage_logs(vehicle_id, customer_id, mileage, source, notes)
    VALUES (a.vehicle_id, a.customer_id, _mileage, 'technician', 'Logged at job finish');
  END IF;

  v_inv := public.create_invoice_for_appointment(_appointment_id);

  PERFORM public._notify_staff_customer_action(
    'Job finished',
    COALESCE(a.service_type,'Job') || ' was marked finished by the technician' || CASE WHEN v_inv IS NULL THEN ' (no approved estimate — invoice needed).' ELSE '.' END,
    '/admin?tab=repair-orders');

  RETURN jsonb_build_object('ok', true, 'invoice_id', v_inv);
END $$;
REVOKE ALL ON FUNCTION public.tech_finish_job(uuid, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.tech_finish_job(uuid, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_expired_estimate_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e public.estimates;
BEGIN
  IF auth.uid() IS NOT NULL AND public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  SELECT * INTO e FROM public.estimates WHERE id = NEW.estimate_id;
  IF e.status = 'expired' OR (e.status = 'sent' AND e.valid_until IS NOT NULL AND e.valid_until < (now() AT TIME ZONE 'America/New_York')::date) THEN
    RAISE EXCEPTION 'This estimate has expired. Call or text 813-501-7572 for an updated quote.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_expired_estimate_decision ON public.estimate_decision_logs;
CREATE TRIGGER trg_guard_expired_estimate_decision BEFORE INSERT ON public.estimate_decision_logs
FOR EACH ROW EXECUTE FUNCTION public.guard_expired_estimate_decision();