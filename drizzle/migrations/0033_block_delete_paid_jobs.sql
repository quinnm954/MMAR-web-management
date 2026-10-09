CREATE OR REPLACE FUNCTION public.block_delete_paid_appointment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM invoices WHERE appointment_id = OLD.id AND status = 'paid') THEN
    RAISE EXCEPTION 'This job has a paid invoice and can''t be deleted. Cancel it instead.';
  END IF;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS trg_block_delete_paid_appointment ON public.appointments;
CREATE TRIGGER trg_block_delete_paid_appointment BEFORE DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.block_delete_paid_appointment();