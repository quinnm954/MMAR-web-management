ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_appointment_completed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_appointment_completed_at ON public.appointments;
CREATE TRIGGER trg_set_appointment_completed_at BEFORE INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.set_appointment_completed_at();

UPDATE public.appointments a SET completed_at = COALESCE(
  (SELECT min(i.paid_at) FROM public.invoices i WHERE i.appointment_id = a.id AND i.paid_at IS NOT NULL),
  a.scheduled_at, a.updated_at)
WHERE a.status = 'completed' AND a.completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_completed_at ON public.appointments (completed_at) WHERE completed_at IS NOT NULL;