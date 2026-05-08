CREATE OR REPLACE FUNCTION public.estimate_to_repair_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_appt_id uuid;
  v_service_type text;
BEGIN
  IF NEW.status NOT IN ('approved','partially_approved') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Derive a service_type label
  v_service_type := COALESCE(NULLIF(NEW.estimate_number, ''), 'Approved Estimate');

  IF NEW.appointment_id IS NULL THEN
    -- Auto-create a Repair Order (appointment) for the approved estimate
    INSERT INTO public.appointments (
      customer_id, vehicle_id, service_type, status, board_column, priority, description
    ) VALUES (
      NEW.customer_id,
      NEW.vehicle_id,
      v_service_type,
      'in_progress',
      'in_progress',
      'normal',
      COALESCE(NEW.notes, 'Auto-created from approved estimate')
    )
    RETURNING id INTO v_new_appt_id;

    UPDATE public.estimates
       SET appointment_id = v_new_appt_id,
           updated_at = now()
     WHERE id = NEW.id;
  ELSE
    UPDATE public.appointments
       SET status = CASE WHEN status IN ('completed','cancelled') THEN status ELSE 'in_progress' END,
           board_column = CASE WHEN board_column IN ('completed','cancelled') THEN board_column ELSE 'in_progress' END,
           updated_at = now()
     WHERE id = NEW.appointment_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Backfill: convert existing approved estimates without an appointment
DO $$
DECLARE
  e record;
  new_id uuid;
BEGIN
  FOR e IN SELECT * FROM public.estimates
           WHERE status IN ('approved','partially_approved')
             AND appointment_id IS NULL
  LOOP
    INSERT INTO public.appointments (
      customer_id, vehicle_id, service_type, status, board_column, priority, description
    ) VALUES (
      e.customer_id, e.vehicle_id,
      COALESCE(NULLIF(e.estimate_number, ''), 'Approved Estimate'),
      'in_progress', 'in_progress', 'normal',
      COALESCE(e.notes, 'Auto-created from approved estimate')
    ) RETURNING id INTO new_id;

    UPDATE public.estimates SET appointment_id = new_id, updated_at = now() WHERE id = e.id;
  END LOOP;
END $$;