CREATE OR REPLACE FUNCTION public.estimate_has_paid_invoice(_customer_id uuid, _invoice_id uuid, _appointment_id uuid, _created_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invoices i
    LEFT JOIN public.service_records sr ON sr.id = i.service_record_id
    WHERE i.customer_id = _customer_id AND i.status = 'paid'
      AND (i.id = _invoice_id OR (_invoice_id IS NULL AND _appointment_id IS NOT NULL
        AND _appointment_id = COALESCE(i.appointment_id, sr.appointment_id)
        AND i.created_at >= _created_at))
  );
$$;
REVOKE ALL ON FUNCTION public.estimate_has_paid_invoice(uuid, uuid, uuid, timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.sync_estimate_paid_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.estimate_has_paid_invoice(NEW.customer_id, NEW.converted_to_invoice_id, NEW.appointment_id, NEW.created_at) THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_estimate_paid_status() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER zz_sync_estimate_paid_status BEFORE INSERT OR UPDATE ON public.estimates
FOR EACH ROW EXECUTE FUNCTION public.sync_estimate_paid_status();

CREATE OR REPLACE FUNCTION public.complete_estimates_on_paid_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _appointment_id uuid;
BEGIN
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  _appointment_id := NEW.appointment_id;
  IF _appointment_id IS NULL AND NEW.service_record_id IS NOT NULL THEN
    SELECT appointment_id INTO _appointment_id FROM public.service_records WHERE id = NEW.service_record_id;
  END IF;
  UPDATE public.estimates e SET status = 'completed'
  WHERE e.customer_id = NEW.customer_id AND e.status IS DISTINCT FROM 'completed'
    AND (e.converted_to_invoice_id = NEW.id OR (e.converted_to_invoice_id IS NULL
      AND e.appointment_id = _appointment_id AND e.created_at <= NEW.created_at));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_estimates_on_paid_invoice() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_complete_estimates_on_paid_invoice
AFTER INSERT OR UPDATE OF status, appointment_id, service_record_id, customer_id ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.complete_estimates_on_paid_invoice();