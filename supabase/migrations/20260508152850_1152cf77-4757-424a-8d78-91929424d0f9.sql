-- Add shop_supplies column to invoices and update trigger to populate tax + shop fees from shop_settings
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS shop_supplies numeric NOT NULL DEFAULT 0;

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
BEGIN
  IF NEW.invoice_total IS NULL OR NEW.invoice_total <= 0 THEN
    RETURN NEW;
  END IF;

  new_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);

  -- Treat the technician-entered invoice_total as the parts+labor SUBTOTAL.
  v_subtotal := NEW.invoice_total;

  -- Load shop settings (single row, id=1)
  SELECT * INTO v_settings FROM public.shop_settings WHERE id = 1 LIMIT 1;
  IF FOUND THEN
    v_shop_supplies := LEAST(
      ROUND((v_subtotal * COALESCE(v_settings.shop_supplies_pct, 0))::numeric, 2),
      COALESCE(v_settings.shop_supplies_max, 0)
    );
    v_tax := ROUND(((v_subtotal + v_shop_supplies) * COALESCE(v_settings.tax_rate, 0))::numeric, 2);
  END IF;

  v_total := v_subtotal + v_shop_supplies + v_tax;

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
    line_items, subtotal, shop_supplies, tax, total, status, due_date
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
    (CURRENT_DATE + INTERVAL '14 days')::date
  );

  RETURN NEW;
END;
$function$;

-- Ensure the trigger is attached (older migrations may have created the function without it)
DROP TRIGGER IF EXISTS trg_create_invoice_from_service_record ON public.service_records;
CREATE TRIGGER trg_create_invoice_from_service_record
AFTER INSERT ON public.service_records
FOR EACH ROW
EXECUTE FUNCTION public.create_invoice_from_service_record();

-- Backfill existing invoices that have tax=0 and shop_supplies=0 but a subtotal
UPDATE public.invoices i
SET shop_supplies = LEAST(ROUND((i.subtotal * s.shop_supplies_pct)::numeric, 2), s.shop_supplies_max),
    tax = ROUND(((i.subtotal + LEAST(ROUND((i.subtotal * s.shop_supplies_pct)::numeric, 2), s.shop_supplies_max)) * s.tax_rate)::numeric, 2),
    total = i.subtotal
          + LEAST(ROUND((i.subtotal * s.shop_supplies_pct)::numeric, 2), s.shop_supplies_max)
          + ROUND(((i.subtotal + LEAST(ROUND((i.subtotal * s.shop_supplies_pct)::numeric, 2), s.shop_supplies_max)) * s.tax_rate)::numeric, 2)
FROM public.shop_settings s
WHERE s.id = 1
  AND i.status = 'unpaid'
  AND i.tax = 0
  AND i.shop_supplies = 0
  AND i.subtotal > 0;