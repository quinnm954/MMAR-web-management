CREATE OR REPLACE FUNCTION public.create_invoice_from_service_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_invoice_number text;
  v_line_items jsonb;
BEGIN
  IF NEW.invoice_total IS NULL OR NEW.invoice_total <= 0 THEN
    RETURN NEW;
  END IF;

  new_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);

  -- Prefer structured line items from parts_used so kind/unit_cost flow into invoices for reporting.
  IF NEW.parts_used IS NOT NULL
     AND jsonb_typeof(NEW.parts_used) = 'array'
     AND jsonb_array_length(NEW.parts_used) > 0 THEN
    v_line_items := NEW.parts_used;
  ELSE
    v_line_items := jsonb_build_array(jsonb_build_object(
      'description', NEW.service_type,
      'quantity', 1,
      'unit_price', NEW.invoice_total,
      'amount', NEW.invoice_total
    ));
  END IF;

  INSERT INTO public.invoices (
    customer_id, service_record_id, invoice_number,
    line_items, subtotal, tax, total, status, due_date
  ) VALUES (
    NEW.customer_id,
    NEW.id,
    new_invoice_number,
    v_line_items,
    NEW.invoice_total,
    0,
    NEW.invoice_total,
    'unpaid',
    (CURRENT_DATE + INTERVAL '14 days')::date
  );

  RETURN NEW;
END;
$function$;