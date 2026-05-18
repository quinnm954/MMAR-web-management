
-- 1) Replace invoice creation trigger fn: prefer approved estimate line_items
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
BEGIN
  IF NEW.invoice_total IS NULL OR NEW.invoice_total <= 0 THEN
    RETURN NEW;
  END IF;

  new_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  v_subtotal := NEW.invoice_total;

  IF NEW.appointment_id IS NOT NULL THEN
    SELECT bool_or(COALESCE(review_discount_pledged, false))
      INTO v_review_pledged
      FROM public.estimates
     WHERE appointment_id = NEW.appointment_id;

    -- Pull approved/partially_approved/converted estimate lines for this appointment,
    -- keeping each line's kind / unit_cost / labor_hours so Reports can compute
    -- COGS, parts margin, and billable labor accurately.
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

  -- Prefer: estimate lines > parts_used > single fallback line
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

  -- Parts total (only kind='part' is taxable)
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
    customer_id, service_record_id, invoice_number,
    line_items, subtotal, shop_supplies, tax, total, status, due_date,
    discount_type, discount_value, discount_amount, discount_reason
  ) VALUES (
    NEW.customer_id,
    NEW.id,
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

-- 2) Same for resync trigger fn
CREATE OR REPLACE FUNCTION public.resync_invoice_from_service_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice public.invoices;
  v_settings public.shop_settings;
  v_subtotal numeric;
  v_parts_total numeric := 0;
  v_shop_supplies numeric := 0;
  v_tax numeric := 0;
  v_total numeric;
  v_review_pledged boolean := false;
  v_discount_value numeric := 0;
  v_discount_reason text := NULL;
  v_taxable numeric;
  v_line_items jsonb;
  v_estimate_lines jsonb;
BEGIN
  SELECT * INTO v_invoice FROM public.invoices
   WHERE service_record_id = NEW.id
   ORDER BY created_at DESC
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  IF v_invoice.status IN ('paid','refunded','void') THEN
    RETURN NEW;
  END IF;

  IF NEW.invoice_total IS NOT DISTINCT FROM OLD.invoice_total
     AND NEW.parts_used IS NOT DISTINCT FROM OLD.parts_used
     AND NEW.service_type IS NOT DISTINCT FROM OLD.service_type THEN
    RETURN NEW;
  END IF;

  v_subtotal := COALESCE(NEW.invoice_total, 0);
  IF v_subtotal <= 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.appointment_id IS NOT NULL THEN
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

  UPDATE public.invoices
     SET line_items = v_line_items,
         subtotal = v_subtotal,
         shop_supplies = v_shop_supplies,
         tax = v_tax,
         total = v_total,
         discount_type = 'amount',
         discount_value = v_discount_value,
         discount_amount = v_discount_value,
         discount_reason = v_discount_reason,
         updated_at = now()
   WHERE id = v_invoice.id;

  DELETE FROM public.vehicle_parts_catalog WHERE invoice_id = v_invoice.id;

  RETURN NEW;
END;
$function$;

-- 3) Backfill existing invoices whose line_items have no labor/cost breakdown
--    by pulling approved lines from the linked appointment's estimate.
WITH inv_appt AS (
  SELECT i.id AS invoice_id, sr.appointment_id
    FROM public.invoices i
    JOIN public.service_records sr ON sr.id = i.service_record_id
   WHERE sr.appointment_id IS NOT NULL
), est_lines AS (
  SELECT ia.invoice_id,
         jsonb_agg(li) AS lines
    FROM inv_appt ia
    JOIN public.estimates e ON e.appointment_id = ia.appointment_id
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.line_items, '[]'::jsonb)) li
   WHERE e.status IN ('approved','partially_approved','converted','sent')
     AND COALESCE(li->>'status', 'approved') IN ('approved','partially_approved')
   GROUP BY ia.invoice_id
)
UPDATE public.invoices i
   SET line_items = el.lines,
       updated_at = now()
  FROM est_lines el
 WHERE i.id = el.invoice_id
   AND el.lines IS NOT NULL
   AND jsonb_array_length(el.lines) > 0
   AND NOT EXISTS (
     SELECT 1 FROM jsonb_array_elements(COALESCE(i.line_items, '[]'::jsonb)) li
      WHERE li->>'kind' = 'labor'
        OR COALESCE((li->>'unit_cost')::numeric, 0) > 0
   );
