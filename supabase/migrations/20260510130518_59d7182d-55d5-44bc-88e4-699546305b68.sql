
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS review_discount_pledged boolean NOT NULL DEFAULT false;

-- Update invoice creation trigger to honor the $5 review discount
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

  -- Detect review-discount pledge from any related estimate
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

  v_taxable := v_subtotal - v_discount_value;

  -- Load shop settings (single row, id=1)
  SELECT * INTO v_settings FROM public.shop_settings WHERE id = 1 LIMIT 1;
  IF FOUND THEN
    v_shop_supplies := LEAST(
      ROUND((v_taxable * COALESCE(v_settings.shop_supplies_pct, 0))::numeric, 2),
      COALESCE(v_settings.shop_supplies_max, 0)
    );
    v_tax := ROUND(((v_taxable + v_shop_supplies) * COALESCE(v_settings.tax_rate, 0))::numeric, 2);
  END IF;

  v_total := v_taxable + v_shop_supplies + v_tax;

  IF NEW.parts_used IS NOT NULL
     AND jsonb_typeof(NEW.parts_used) = 'array'
     AND jsonb_array_length(NEW.parts_used) > 0 THEN
    v_line_items := NEW.parts_used;
  ELSE
    v_line_items := jsonb_build_array(jsonb_build_object(
      'description', NEW.service_type,
      'quantity', 1,
      'unit_price', v_subtotal,
      'amount', v_subtotal
    ));
  END IF;

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
