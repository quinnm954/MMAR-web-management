DROP TRIGGER IF EXISTS a0_attach_appointment_invoice ON public.service_records;

CREATE OR REPLACE FUNCTION public.attach_service_record_to_appointment_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.appointment_id IS NOT NULL THEN
    UPDATE public.invoices SET service_record_id = NEW.id
     WHERE appointment_id = NEW.appointment_id AND service_record_id IS NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_attach_appointment_invoice AFTER INSERT ON public.service_records
  FOR EACH ROW EXECUTE FUNCTION public.attach_service_record_to_appointment_invoice();

CREATE OR REPLACE FUNCTION public.skip_invoice_if_appointment_invoiced()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.appointment_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.invoices WHERE appointment_id = NEW.appointment_id) THEN
    RETURN NEW;
  END IF;
  RETURN public.create_invoice_from_service_record_impl(NEW);
END $$;