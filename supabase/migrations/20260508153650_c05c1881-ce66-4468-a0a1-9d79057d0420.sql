
ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS labor_cost_per_hour numeric NOT NULL DEFAULT 35;

CREATE TABLE IF NOT EXISTS public.vehicle_parts_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vin text NOT NULL,
  vehicle_id uuid,
  customer_id uuid,
  invoice_id uuid,
  service_record_id uuid,
  part_name text NOT NULL,
  sku text,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  labor_description text,
  labor_hours numeric,
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_parts_catalog_vin ON public.vehicle_parts_catalog(vin);
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_catalog_vehicle ON public.vehicle_parts_catalog(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_parts_catalog_invoice ON public.vehicle_parts_catalog(invoice_id);

ALTER TABLE public.vehicle_parts_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vehicle parts catalog" ON public.vehicle_parts_catalog;
CREATE POLICY "Admins manage vehicle parts catalog"
  ON public.vehicle_parts_catalog
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.catalog_invoice_to_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle public.vehicles;
  v_service public.service_records;
  v_labor_desc text;
  v_labor_hours numeric;
  li jsonb;
  v_kind text;
  v_name text;
  v_sku text;
  v_qty numeric;
  v_price numeric;
  v_cost numeric;
BEGIN
  -- Find the linked service record (and thus vehicle)
  IF NEW.service_record_id IS NOT NULL THEN
    SELECT * INTO v_service FROM public.service_records WHERE id = NEW.service_record_id;
  END IF;

  IF v_service.vehicle_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id = v_service.vehicle_id;

  -- Require a VIN to catalog
  IF v_vehicle.vin IS NULL OR length(trim(v_vehicle.vin)) = 0 THEN
    RETURN NEW;
  END IF;

  v_labor_desc := COALESCE(v_service.labor_performed, v_service.service_type);

  -- Catalog each line item
  IF NEW.line_items IS NOT NULL AND jsonb_typeof(NEW.line_items) = 'array' THEN
    FOR li IN SELECT * FROM jsonb_array_elements(NEW.line_items) LOOP
      v_kind  := COALESCE(li->>'kind', 'part');
      v_name  := COALESCE(li->>'description', li->>'name', 'Item');
      v_sku   := li->>'sku';
      v_qty   := COALESCE((li->>'quantity')::numeric, 1);
      v_price := COALESCE((li->>'unit_price')::numeric, 0);
      v_cost  := COALESCE((li->>'unit_cost')::numeric, 0);
      v_labor_hours := NULLIF(li->>'labor_hours','')::numeric;

      INSERT INTO public.vehicle_parts_catalog(
        vin, vehicle_id, customer_id, invoice_id, service_record_id,
        part_name, sku, quantity, unit_price, unit_cost,
        labor_description, labor_hours, performed_at
      ) VALUES (
        v_vehicle.vin, v_vehicle.id, NEW.customer_id, NEW.id, NEW.service_record_id,
        v_name, v_sku, v_qty, v_price, v_cost,
        v_labor_desc, v_labor_hours, COALESCE(v_service.service_date::timestamptz, now())
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_catalog_invoice_to_vehicle ON public.invoices;
CREATE TRIGGER trg_catalog_invoice_to_vehicle
  AFTER INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.catalog_invoice_to_vehicle();
