-- 1. Auto-promote linked appointment to repair-order state when an estimate is approved
CREATE OR REPLACE FUNCTION public.estimate_to_repair_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.appointment_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status IN ('approved', 'partially_approved')
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.appointments
       SET status = CASE WHEN status IN ('completed','cancelled') THEN status ELSE 'in_progress' END,
           board_column = CASE WHEN board_column IN ('completed','cancelled') THEN board_column ELSE 'in_progress' END,
           updated_at = now()
     WHERE id = NEW.appointment_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_estimate_to_repair_order ON public.estimates;
CREATE TRIGGER trg_estimate_to_repair_order
AFTER INSERT OR UPDATE OF status ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.estimate_to_repair_order();

-- 2. Allow staff (parts role or higher) to update appointments — needed for technician assignment from RO detail
CREATE POLICY "Staff update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 3. Audit trail for appointments (tracks technician assignment changes among other field changes)
DROP TRIGGER IF EXISTS trg_audit_appointments ON public.appointments;
CREATE TRIGGER trg_audit_appointments
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.audit_table_change();