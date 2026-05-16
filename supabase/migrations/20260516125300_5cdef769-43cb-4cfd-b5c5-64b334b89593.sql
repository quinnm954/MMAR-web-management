
CREATE OR REPLACE FUNCTION public.apply_invoice_fees()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_settings public.shop_settings;
  v_subtotal numeric := COALESCE(NEW.subtotal, 0);
  v_discount numeric := 0;
  v_parts_total numeric := 0;
  v_parts_discount numeric := 0;
  v_taxable numeric;
  v_shop_supplies numeric := COALESCE(NEW.shop_supplies, 0);
  v_tax numeric := COALESCE(NEW.tax, 0);
BEGIN
  IF v_subtotal <= 0 THEN
    NEW.discount_amount := 0;
    NEW.total := 0;
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.discount_type, 'amount') = 'percent' THEN
    v_discount := ROUND((v_subtotal * COALESCE(NEW.discount_value, 0) / 100.0)::numeric, 2);
  ELSE
    v_discount := ROUND(COALESCE(NEW.discount_value, 0)::numeric, 2);
  END IF;
  IF v_discount < 0 THEN v_discount := 0; END IF;
  IF v_discount > v_subtotal THEN v_discount := v_subtotal; END IF;
  NEW.discount_amount := v_discount;

  -- Compute parts-only taxable base from line_items (kind='part' or unspecified).
  IF NEW.line_items IS NOT NULL AND jsonb_typeof(NEW.line_items) = 'array' THEN
    SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric, 0)), 0)
      INTO v_parts_total
      FROM jsonb_array_elements(NEW.line_items) li
     WHERE COALESCE(li->>'kind', 'part') = 'part';
  ELSE
    v_parts_total := v_subtotal;
  END IF;
  IF v_parts_total < 0 THEN v_parts_total := 0; END IF;

  -- Proportionally apply discount to the parts portion only.
  IF v_subtotal > 0 THEN
    v_parts_discount := ROUND((v_discount * v_parts_total / v_subtotal)::numeric, 2);
  END IF;
  v_taxable := GREATEST(v_parts_total - v_parts_discount, 0);

  IF COALESCE(NEW.shop_supplies, 0) = 0 AND COALESCE(NEW.tax, 0) = 0 THEN
    SELECT * INTO v_settings FROM public.shop_settings WHERE id = 1 LIMIT 1;
    IF FOUND THEN
      v_shop_supplies := LEAST(
        ROUND((v_taxable * COALESCE(v_settings.shop_supplies_pct, 0))::numeric, 2),
        COALESCE(v_settings.shop_supplies_max, 0)
      );
      v_tax := ROUND(((v_taxable + v_shop_supplies) * COALESCE(v_settings.tax_rate, 0))::numeric, 2);
      NEW.shop_supplies := v_shop_supplies;
      NEW.tax := v_tax;
    END IF;
  END IF;

  NEW.total := ROUND(((v_subtotal - v_discount) + COALESCE(NEW.shop_supplies, 0) + COALESCE(NEW.tax, 0))::numeric, 2);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_invoice_from_service_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_invoice_number text;
  v_line_items jsonb;
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
  END IF;

  IF v_review_pledged THEN
    v_discount_value := LEAST(5, v_subtotal);
    v_discount_reason := '5-star Google review discount';
  END IF;

  IF NEW.parts_used IS NOT NULL
     AND jsonb_typeof(NEW.parts_used) = 'array'
     AND jsonb_array_length(NEW.parts_used) > 0 THEN
    v_line_items := NEW.parts_used;
    SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric, 0)), 0)
      INTO v_parts_total
      FROM jsonb_array_elements(v_line_items) li
     WHERE COALESCE(li->>'kind', 'part') = 'part';
  ELSE
    v_line_items := jsonb_build_array(jsonb_build_object(
      'description', NEW.service_type,
      'quantity', 1,
      'unit_price', v_subtotal,
      'amount', v_subtotal,
      'kind', 'part'
    ));
    v_parts_total := v_subtotal;
  END IF;

  v_taxable := GREATEST(v_parts_total - v_discount_value, 0);

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
  END IF;

  IF v_review_pledged THEN
    v_discount_value := LEAST(5, v_subtotal);
    v_discount_reason := '5-star Google review discount';
  END IF;

  IF NEW.parts_used IS NOT NULL
     AND jsonb_typeof(NEW.parts_used) = 'array'
     AND jsonb_array_length(NEW.parts_used) > 0 THEN
    v_line_items := NEW.parts_used;
    SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric, 0)), 0)
      INTO v_parts_total
      FROM jsonb_array_elements(v_line_items) li
     WHERE COALESCE(li->>'kind', 'part') = 'part';
  ELSE
    v_line_items := jsonb_build_array(jsonb_build_object(
      'description', NEW.service_type,
      'quantity', 1,
      'unit_price', v_subtotal,
      'amount', v_subtotal,
      'kind', 'part'
    ));
    v_parts_total := v_subtotal;
  END IF;

  v_taxable := GREATEST(v_parts_total - v_discount_value, 0);

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
