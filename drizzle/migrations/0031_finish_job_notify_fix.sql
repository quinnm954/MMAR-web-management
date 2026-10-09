CREATE OR REPLACE FUNCTION public.tech_finish_job(_appointment_id uuid, _mileage integer DEFAULT NULL, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.appointments; v_inv uuid; r record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO a FROM public.appointments WHERE id = _appointment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
  IF NOT (a.assigned_technician_id = auth.uid() OR public.has_role(auth.uid(),'admin')) THEN
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

  FOR r IN SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('owner','admin') LOOP
    PERFORM public.create_notification(r.user_id, 'Job finished',
      COALESCE(a.service_type,'Job') || CASE WHEN v_inv IS NULL THEN ' is finished. No approved estimate, so an invoice is needed.' ELSE ' is finished and the invoice was sent.' END,
      'appointment_updates', '/admin?tab=repair-orders', jsonb_build_object('appointment_id', a.id));
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'invoice_id', v_inv);
END $$;