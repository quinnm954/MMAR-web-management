DROP TRIGGER IF EXISTS trg_service_record_create_invoice ON public.service_records;

CREATE OR REPLACE FUNCTION public.apply_invoice_fees()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings public.shop_settings;
  v_subtotal numeric := COALESCE(NEW.subtotal, 0);
  v_shop_supplies numeric := COALESCE(NEW.shop_supplies, 0);
  v_tax numeric := COALESCE(NEW.tax, 0);
BEGIN
  IF v_subtotal <= 0 THEN
    RETURN NEW;
  END IF;

  -- Only auto-calculate when the caller did not provide fees/tax yet.
  IF COALESCE(NEW.shop_supplies, 0) = 0 AND COALESCE(NEW.tax, 0) = 0 THEN
    SELECT * INTO v_settings FROM public.shop_settings WHERE id = 1 LIMIT 1;
    IF FOUND THEN
      v_shop_supplies := LEAST(
        ROUND((v_subtotal * COALESCE(v_settings.shop_supplies_pct, 0))::numeric, 2),
        COALESCE(v_settings.shop_supplies_max, 0)
      );
      v_tax := ROUND(((v_subtotal + v_shop_supplies) * COALESCE(v_settings.tax_rate, 0))::numeric, 2);
      NEW.shop_supplies := v_shop_supplies;
      NEW.tax := v_tax;
    END IF;
  END IF;

  NEW.total := ROUND((v_subtotal + COALESCE(NEW.shop_supplies, 0) + COALESCE(NEW.tax, 0))::numeric, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_invoice_fees ON public.invoices;
CREATE TRIGGER trg_apply_invoice_fees
  BEFORE INSERT OR UPDATE OF subtotal, shop_supplies, tax ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_invoice_fees();