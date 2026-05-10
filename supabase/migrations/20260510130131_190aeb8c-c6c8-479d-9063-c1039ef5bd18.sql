
-- Add discount support to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'amount',
  ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason text;

-- Update fee trigger to factor in discount before tax
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
  v_taxable numeric;
  v_shop_supplies numeric := COALESCE(NEW.shop_supplies, 0);
  v_tax numeric := COALESCE(NEW.tax, 0);
BEGIN
  IF v_subtotal <= 0 THEN
    NEW.discount_amount := 0;
    NEW.total := 0;
    RETURN NEW;
  END IF;

  -- Compute discount amount from type/value
  IF COALESCE(NEW.discount_type, 'amount') = 'percent' THEN
    v_discount := ROUND((v_subtotal * COALESCE(NEW.discount_value, 0) / 100.0)::numeric, 2);
  ELSE
    v_discount := ROUND(COALESCE(NEW.discount_value, 0)::numeric, 2);
  END IF;
  IF v_discount < 0 THEN v_discount := 0; END IF;
  IF v_discount > v_subtotal THEN v_discount := v_subtotal; END IF;
  NEW.discount_amount := v_discount;

  v_taxable := v_subtotal - v_discount;

  -- Only auto-calculate fees/tax when caller did not provide them.
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

  NEW.total := ROUND((v_taxable + COALESCE(NEW.shop_supplies, 0) + COALESCE(NEW.tax, 0))::numeric, 2);
  RETURN NEW;
END;
$function$;
