
CREATE OR REPLACE FUNCTION public.guard_appointment_customer_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_id            IS DISTINCT FROM OLD.customer_id
  OR NEW.vehicle_id             IS DISTINCT FROM OLD.vehicle_id
  OR NEW.membership_id          IS DISTINCT FROM OLD.membership_id
  OR NEW.service_type           IS DISTINCT FROM OLD.service_type
  OR NEW.scheduled_at           IS DISTINCT FROM OLD.scheduled_at
  OR NEW.status                 IS DISTINCT FROM OLD.status
  OR NEW.technician_notes       IS DISTINCT FROM OLD.technician_notes
  OR NEW.assigned_technician_id IS DISTINCT FROM OLD.assigned_technician_id
  OR NEW.board_column           IS DISTINCT FROM OLD.board_column
  OR NEW.priority               IS DISTINCT FROM OLD.priority
  OR NEW.sort_order             IS DISTINCT FROM OLD.sort_order
  OR NEW.reminder_sent_24h      IS DISTINCT FROM OLD.reminder_sent_24h
  OR NEW.reminder_sent_2h       IS DISTINCT FROM OLD.reminder_sent_2h
  OR NEW.source                 IS DISTINCT FROM OLD.source
  OR NEW.confirmation_token     IS DISTINCT FROM OLD.confirmation_token
  OR NEW.repair_order_number    IS DISTINCT FROM OLD.repair_order_number
  THEN
    RAISE EXCEPTION 'Customers cannot modify scheduling or assignment fields on appointments';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_appointment_customer_update ON public.appointments;
CREATE TRIGGER trg_guard_appointment_customer_update
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.guard_appointment_customer_update();
