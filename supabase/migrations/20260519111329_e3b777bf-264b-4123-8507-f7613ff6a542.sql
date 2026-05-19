
-- Add technician_id directly on invoices so reporting and admin tools don't have to walk service_record → appointment
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS technician_id uuid;

CREATE INDEX IF NOT EXISTS idx_invoices_technician_id ON public.invoices(technician_id);

-- Backfill from the appointment that produced each invoice
UPDATE public.invoices i
   SET technician_id = a.assigned_technician_id
  FROM public.service_records sr
  JOIN public.appointments a ON a.id = sr.appointment_id
 WHERE i.service_record_id = sr.id
   AND i.technician_id IS NULL
   AND a.assigned_technician_id IS NOT NULL;

-- Update auto-create trigger to capture tech from the appointment
CREATE OR REPLACE FUNCTION public.create_invoice_from_service_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_invoice_number text;
  v_line_items jsonb;
  v_estimate_lines jsonb;
  v_subtotal numeric;
  v_settings public.shop_settings;
  v_parts_total numeric := 0;
  v_shop_supplies numeric := 0;
  v_tax numeric := 0;
  v_total numeric;
  v_review_pledged boolean := false;
  v_discount_value numeric := 0;
  v_discount_reason text := NULL;
  v_taxable numeric;
  v_tech_id uuid;
BEGIN
  IF NEW.invoice_total IS NULL OR NEW.invoice_total <= 0 THEN
    RETURN NEW;
  END IF;

  new_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  v_subtotal := NEW.invoice_total;

  IF NEW.appointment_id IS NOT NULL THEN
    SELECT assigned_technician_id INTO v_tech_id
      FROM public.appointments WHERE id = NEW.appointment_id;

    SELECT bool_or(COALESCE(review_discount_pledged, false))
      INTO v_review_pledged
      FROM public.estimates
     WHERE appointment_id = NEW.appointment_id;

    SELECT COALESCE(jsonb_agg(li), '[]'::jsonb)
      INTO v_estimate_lines
      FROM public.estimates e,
           jsonb_array_elements(COALESCE(e.line_items, '[]'::jsonb)) li
     WHERE e.appointment_id = NEW.appointment_id
       AND e.status IN ('approved','partially_approved','converted','sent')
       AND COALESCE(li->>'status', 'approved') IN ('approved','partially_approved');
  END IF;

  IF v_review_pledged THEN
    v_discount_value := LEAST(5, v_subtotal);
    v_discount_reason := '5-star Google review discount';
  END IF;

  IF v_estimate_lines IS NOT NULL AND jsonb_array_length(v_estimate_lines) > 0 THEN
    v_line_items := v_estimate_lines;
  ELSIF NEW.parts_used IS NOT NULL
     AND jsonb_typeof(NEW.parts_used) = 'array'
     AND jsonb_array_length(NEW.parts_used) > 0 THEN
    v_line_items := NEW.parts_used;
  ELSE
    v_line_items := jsonb_build_array(jsonb_build_object(
      'description', NEW.service_type,
      'quantity', 1,
      'unit_price', v_subtotal,
      'amount', v_subtotal,
      'kind', 'part'
    ));
  END IF;

  SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric, 0)), 0)
    INTO v_parts_total
    FROM jsonb_array_elements(v_line_items) li
   WHERE COALESCE(li->>'kind', 'part') = 'part';

  v_taxable := GREATEST(v_parts_total - LEAST(v_discount_value, v_parts_total), 0);

  SELECT * INTO v_settings FROM public.shop_settings WHERE id = 1 LIMIT 1;
  IF FOUND THEN
    v_shop_supplies := LEAST(
      ROUND((v_taxable * COALESCE(v_settings.shop_supplies_pct, 0))::numeric, 2),
      COALESCE(v_settings.shop_supplies_max, 0)
    );
    v_tax := ROUND(((v_taxable + v_shop_supplies) * COALESCE(v_settings.tax_rate, 0))::numeric, 2);
  END IF;

  v_total := (v_subtotal - v_discount_value) + v_shop_supplies + v_tax;

  INSERT INTO public.invoices (
    customer_id, service_record_id, technician_id, invoice_number,
    line_items, subtotal, shop_supplies, tax, total, status, due_date,
    discount_type, discount_value, discount_amount, discount_reason
  ) VALUES (
    NEW.customer_id,
    NEW.id,
    v_tech_id,
    new_invoice_number,
    v_line_items,
    v_subtotal,
    v_shop_supplies,
    v_tax,
    v_total,
    'unpaid',
    (CURRENT_DATE + INTERVAL '14 days')::date,
    'amount',
    v_discount_value,
    v_discount_value,
    v_discount_reason
  );

  RETURN NEW;
END;
$function$;

-- Keep invoice technician in sync when an appointment's assigned tech changes
CREATE OR REPLACE FUNCTION public.sync_invoice_tech_from_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.assigned_technician_id IS DISTINCT FROM OLD.assigned_technician_id THEN
    UPDATE public.invoices i
       SET technician_id = NEW.assigned_technician_id,
           updated_at = now()
      FROM public.service_records sr
     WHERE i.service_record_id = sr.id
       AND sr.appointment_id = NEW.id
       AND i.status NOT IN ('paid','refunded','void')
       AND (i.technician_id IS NULL OR i.technician_id = OLD.assigned_technician_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_invoice_tech_from_appointment ON public.appointments;
CREATE TRIGGER trg_sync_invoice_tech_from_appointment
AFTER UPDATE OF assigned_technician_id ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_tech_from_appointment();
