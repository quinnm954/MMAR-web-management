-- Resync invoice when its service_record changes (parts_used, invoice_total, service_type)
CREATE OR REPLACE FUNCTION public.resync_invoice_from_service_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invoice public.invoices;
  v_settings public.shop_settings;
  v_subtotal numeric;
  v_shop_supplies numeric := 0;
  v_tax numeric := 0;
  v_total numeric;
  v_review_pledged boolean := false;
  v_discount_value numeric := 0;
  v_discount_reason text := NULL;
  v_taxable numeric;
  v_line_items jsonb;
BEGIN
  -- Find the invoice tied to this service record (skip if none, or paid/refunded)
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

  -- Nothing relevant changed?
  IF NEW.invoice_total IS NOT DISTINCT FROM OLD.invoice_total
     AND NEW.parts_used IS NOT DISTINCT FROM OLD.parts_used
     AND NEW.service_type IS NOT DISTINCT FROM OLD.service_type THEN
    RETURN NEW;
  END IF;

  v_subtotal := COALESCE(NEW.invoice_total, 0);
  IF v_subtotal <= 0 THEN
    RETURN NEW;
  END IF;

  -- Recompute review-discount pledge from related estimates
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

  -- Re-catalog parts to vehicle catalog: clear prior rows for this invoice and let
  -- catalog_invoice_to_vehicle re-run via a no-op update on the invoice (already done above).
  DELETE FROM public.vehicle_parts_catalog WHERE invoice_id = v_invoice.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resync_invoice_from_service_record ON public.service_records;
CREATE TRIGGER trg_resync_invoice_from_service_record
AFTER UPDATE ON public.service_records
FOR EACH ROW
EXECUTE FUNCTION public.resync_invoice_from_service_record();

-- Ensure the existing catalog trigger also fires on invoice UPDATE (it likely only fires on INSERT).
-- Re-attach to cover both INSERT and UPDATE so re-cataloging happens after a resync.
DROP TRIGGER IF EXISTS trg_catalog_invoice_to_vehicle ON public.invoices;
CREATE TRIGGER trg_catalog_invoice_to_vehicle
AFTER INSERT OR UPDATE OF line_items ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.catalog_invoice_to_vehicle();