ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_financed boolean NOT NULL DEFAULT false;
UPDATE public.invoices i SET is_financed = true WHERE EXISTS (SELECT 1 FROM public.financing_contracts c WHERE c.invoice_id = i.id AND c.status <> 'cancelled');

CREATE OR REPLACE FUNCTION public.sync_financing_payment_to_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv uuid; _total numeric; _paid numeric; _ref text; _amt numeric;
BEGIN
  IF NEW.status <> 'paid' OR (TG_OP = 'UPDATE' AND OLD.status = 'paid') THEN RETURN NEW; END IF;
  SELECT invoice_id INTO _inv FROM financing_contracts WHERE id = NEW.contract_id;
  IF _inv IS NULL THEN RETURN NEW; END IF;
  _ref := 'financing:' || NEW.id::text;
  IF EXISTS (SELECT 1 FROM invoice_payments WHERE invoice_id = _inv AND reference = _ref) THEN RETURN NEW; END IF;
  SELECT total INTO _total FROM invoices WHERE id = _inv;
  SELECT COALESCE(sum(amount),0) INTO _paid FROM invoice_payments WHERE invoice_id = _inv;
  _amt := LEAST(NEW.amount, GREATEST(_total - _paid, 0));
  IF _amt <= 0 THEN RETURN NEW; END IF;
  INSERT INTO invoice_payments(invoice_id, amount, method, reference, notes, paid_at, stripe_payment_intent_id)
  VALUES (_inv, _amt, 'card', _ref, COALESCE(NEW.label,'Financing payment') || ' - financing', COALESCE(NEW.paid_at, now()), NEW.stripe_payment_intent_id);
  UPDATE invoices SET is_financed = true WHERE id = _inv AND NOT is_financed;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_financing_payment_to_invoice ON public.financing_payments;
CREATE TRIGGER trg_sync_financing_payment_to_invoice AFTER INSERT OR UPDATE OF status ON public.financing_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_financing_payment_to_invoice();

CREATE OR REPLACE FUNCTION public.my_tech_earnings(_from date, _to date)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _rate numeric; _rows jsonb;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid,'technician') THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT COALESCE((SELECT e.hourly_rate FROM employees e WHERE e.user_id = _uid AND e.hourly_rate > 0 LIMIT 1),
                  (SELECT t.hourly_rate FROM technician_agreements t WHERE t.tech_user_id = _uid ORDER BY created_at DESC LIMIT 1), 40) INTO _rate;
  WITH jobs AS (
    SELECT a.id, COALESCE(a.completed_at, a.scheduled_at, a.created_at) AS job_at, a.service_type,
      COALESCE((SELECT sum(public.invoice_tech_hours(i.line_items)) FROM invoices i
                WHERE i.appointment_id = a.id AND (i.status = 'paid' OR (i.is_financed AND COALESCE(i.amount_paid,0) > 0))),0) AS hours
    FROM appointments a
    WHERE a.assigned_technician_id = _uid AND a.status IN ('completed','done','closed')
      AND COALESCE(a.completed_at, a.scheduled_at, a.created_at)::date BETWEEN _from AND _to)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'date',job_at,'service',service_type,'hours',hours,'pay',round(hours*_rate,2)) ORDER BY job_at DESC),'[]') INTO _rows FROM jobs;
  RETURN jsonb_build_object('rate',_rate,'jobs',_rows,
    'hours',(SELECT COALESCE(sum((j->>'hours')::numeric),0) FROM jsonb_array_elements(_rows) j),
    'pay',(SELECT COALESCE(sum((j->>'pay')::numeric),0) FROM jsonb_array_elements(_rows) j));
END $function$;