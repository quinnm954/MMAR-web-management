CREATE OR REPLACE FUNCTION public.complete_ro_on_invoice_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _appt uuid;
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    _appt := NEW.appointment_id;
    IF _appt IS NULL AND NEW.service_record_id IS NOT NULL THEN
      SELECT appointment_id INTO _appt FROM public.service_records WHERE id = NEW.service_record_id;
    END IF;
    IF _appt IS NOT NULL THEN
      UPDATE public.appointments SET status = 'completed', board_column = 'completed'
      WHERE id = _appt AND status NOT IN ('completed','cancelled');
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_complete_ro_on_invoice_paid ON public.invoices;
CREATE TRIGGER trg_complete_ro_on_invoice_paid AFTER INSERT OR UPDATE OF status ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.complete_ro_on_invoice_paid();