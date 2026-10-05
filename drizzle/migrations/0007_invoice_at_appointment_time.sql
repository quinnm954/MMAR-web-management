ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS invoices_appointment_unique ON public.invoices(appointment_id) WHERE appointment_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_invoice_for_appointment(_appointment_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.appointments; v_lines jsonb; v_sub numeric; v_parts numeric; v_settings public.shop_settings;
  v_sup numeric := 0; v_tax numeric := 0; v_disc numeric := 0; v_reason text; v_pledged boolean; v_taxable numeric; v_id uuid;
BEGIN
  SELECT * INTO a FROM public.appointments WHERE id = _appointment_id;
  IF NOT FOUND OR a.customer_id IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_id FROM public.invoices WHERE appointment_id = _appointment_id;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  SELECT COALESCE(jsonb_agg(li), '[]'::jsonb), bool_or(COALESCE(e.review_discount_pledged,false))
    INTO v_lines, v_pledged
    FROM public.estimates e, jsonb_array_elements(COALESCE(e.line_items,'[]'::jsonb)) li
   WHERE e.appointment_id = _appointment_id
     AND e.status IN ('approved','partially_approved','converted')
     AND COALESCE(li->>'status','approved') IN ('approved','partially_approved');
  IF jsonb_array_length(v_lines) = 0 THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric,0)),0) INTO v_sub FROM jsonb_array_elements(v_lines) li;
  IF v_sub <= 0 THEN RETURN NULL; END IF;
  SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric,0)),0) INTO v_parts
    FROM jsonb_array_elements(v_lines) li WHERE COALESCE(li->>'kind','part') = 'part';
  IF v_pledged THEN v_disc := LEAST(5, v_sub); v_reason := '5-star Google review discount'; END IF;
  v_taxable := GREATEST(v_parts - LEAST(v_disc, v_parts), 0);
  SELECT * INTO v_settings FROM public.shop_settings WHERE id = 1;
  IF FOUND THEN
    v_sup := LEAST(ROUND((v_taxable * COALESCE(v_settings.shop_supplies_pct,0))::numeric,2), COALESCE(v_settings.shop_supplies_max,0));
    v_tax := ROUND(((v_taxable + v_sup) * COALESCE(v_settings.tax_rate,0))::numeric,2);
  END IF;

  INSERT INTO public.invoices (customer_id, appointment_id, technician_id, invoice_number, line_items, subtotal,
    shop_supplies, tax, total, status, due_date, discount_type, discount_value, discount_amount, discount_reason)
  VALUES (a.customer_id, a.id, a.assigned_technician_id,
    'INV-' || to_char(now(),'YYYYMMDD') || '-' || substr(replace(a.id::text,'-',''),1,6),
    v_lines, v_sub, v_sup, v_tax, (v_sub - v_disc) + v_sup + v_tax, 'unpaid', CURRENT_DATE,
    'amount', v_disc, v_disc, v_reason)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.create_invoice_for_appointment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_for_appointment(uuid) TO service_role;

-- When the job is finished, attach the service record to the invoice already sent instead of creating a second one
CREATE OR REPLACE FUNCTION public.attach_service_record_to_appointment_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NEW.appointment_id IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO v_id FROM public.invoices WHERE appointment_id = NEW.appointment_id AND service_record_id IS NULL;
  IF v_id IS NOT NULL THEN
    UPDATE public.invoices SET service_record_id = NEW.id WHERE id = v_id;
    NEW.invoice_total := NULL; -- skip creating a duplicate invoice
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS a0_attach_appointment_invoice ON public.service_records;
CREATE TRIGGER a0_attach_appointment_invoice BEFORE INSERT ON public.service_records
  FOR EACH ROW EXECUTE FUNCTION public.attach_service_record_to_appointment_invoice();