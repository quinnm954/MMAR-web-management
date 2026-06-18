
-- 1. Add the new column
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS repair_order_number text;

CREATE INDEX IF NOT EXISTS idx_appointments_repair_order_number
  ON public.appointments(repair_order_number)
  WHERE repair_order_number IS NOT NULL;

-- 2. Backfill: move EST-... values out of service_type into repair_order_number
UPDATE public.appointments
   SET repair_order_number = service_type,
       service_type = 'Approved Estimate'
 WHERE service_type LIKE 'EST-%'
   AND repair_order_number IS NULL;

-- 3. Update the trigger so future approvals split the two fields
CREATE OR REPLACE FUNCTION public.estimate_to_repair_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_appt_id uuid;
  v_ro_number text;
  v_service_type text;
BEGIN
  IF NEW.status NOT IN ('approved','partially_approved') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_ro_number    := NULLIF(NEW.estimate_number, '');
  -- service_type is NOT NULL on appointments; use a neutral placeholder
  -- so staff can re-classify later via the admin UI.
  v_service_type := 'Approved Estimate';

  IF NEW.appointment_id IS NULL THEN
    INSERT INTO public.appointments (
      customer_id, vehicle_id, service_type, repair_order_number,
      status, board_column, priority, description
    ) VALUES (
      NEW.customer_id,
      NEW.vehicle_id,
      v_service_type,
      v_ro_number,
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
           repair_order_number = COALESCE(repair_order_number, v_ro_number),
           updated_at = now()
     WHERE id = NEW.appointment_id;
  END IF;

  RETURN NEW;
END;
$function$;
