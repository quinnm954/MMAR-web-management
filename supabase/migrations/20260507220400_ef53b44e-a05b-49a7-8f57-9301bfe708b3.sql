
ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

CREATE INDEX IF NOT EXISTS idx_memberships_stripe_sub ON public.memberships(stripe_subscription_id);

UPDATE public.membership_plans SET stripe_price_id = 'price_1TUa115Q2VPXrjOxaMNCUoBD' WHERE slug = 'essential';
UPDATE public.membership_plans SET stripe_price_id = 'price_1TUa165Q2VPXrjOx1CQpx8l6' WHERE slug = 'full-care';
UPDATE public.membership_plans SET stripe_price_id = 'price_1TUa175Q2VPXrjOxI4xp6Mnr' WHERE slug = 'premium';

-- Auto-create invoice when a service record is logged with an invoice_total
CREATE OR REPLACE FUNCTION public.create_invoice_from_service_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invoice_number text;
BEGIN
  IF NEW.invoice_total IS NULL OR NEW.invoice_total <= 0 THEN
    RETURN NEW;
  END IF;

  new_invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);

  INSERT INTO public.invoices (
    customer_id, service_record_id, invoice_number,
    line_items, subtotal, tax, total, status, due_date
  ) VALUES (
    NEW.customer_id,
    NEW.id,
    new_invoice_number,
    jsonb_build_array(jsonb_build_object(
      'description', NEW.service_type,
      'quantity', 1,
      'unit_price', NEW.invoice_total,
      'amount', NEW.invoice_total
    )),
    NEW.invoice_total,
    0,
    NEW.invoice_total,
    'unpaid',
    (CURRENT_DATE + INTERVAL '14 days')::date
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_record_create_invoice ON public.service_records;
CREATE TRIGGER trg_service_record_create_invoice
  AFTER INSERT ON public.service_records
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_from_service_record();
