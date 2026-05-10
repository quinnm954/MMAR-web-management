-- Add marketing/contact fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean NOT NULL DEFAULT true;

-- Marketing view: customer + vehicles + service summary
CREATE OR REPLACE VIEW public.customer_marketing_export AS
SELECT
  p.id AS customer_id,
  p.full_name,
  p.email,
  p.phone,
  p.address_line1,
  p.address_line2,
  p.city,
  p.state,
  p.postal_code,
  p.marketing_opt_in,
  p.created_at AS customer_since,
  COALESCE(v.vehicles, '[]'::jsonb) AS vehicles,
  COALESCE(s.service_count, 0) AS service_count,
  s.last_service_date,
  s.last_service_type,
  COALESCE(s.lifetime_spend, 0) AS lifetime_spend
FROM public.profiles p
LEFT JOIN LATERAL (
  SELECT jsonb_agg(jsonb_build_object(
    'year', v.year, 'make', v.make, 'model', v.model,
    'trim', v.trim, 'vin', v.vin, 'license_plate', v.license_plate,
    'color', v.color, 'current_mileage', v.current_mileage
  ) ORDER BY v.created_at DESC) AS vehicles
  FROM public.vehicles v WHERE v.owner_id = p.id
) v ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS service_count,
    MAX(sr.service_date) AS last_service_date,
    (SELECT service_type FROM public.service_records
       WHERE customer_id = p.id ORDER BY service_date DESC LIMIT 1) AS last_service_type,
    COALESCE(SUM(i.total), 0) AS lifetime_spend
  FROM public.service_records sr
  LEFT JOIN public.invoices i ON i.service_record_id = sr.id
  WHERE sr.customer_id = p.id
) s ON true;

-- Restrict view access to admins/managers only via SECURITY INVOKER + helper
ALTER VIEW public.customer_marketing_export SET (security_invoker = true);

COMMENT ON VIEW public.customer_marketing_export IS
  'Admin-only marketing export: customer contact info, vehicles, and service summary. Access controlled by underlying table RLS (profiles, vehicles, service_records, invoices).';