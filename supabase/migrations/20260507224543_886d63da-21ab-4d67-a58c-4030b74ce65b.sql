
-- ============ ESTIMATES ============
CREATE TABLE public.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vehicle_id uuid,
  appointment_id uuid,
  estimate_number text,
  status text NOT NULL DEFAULT 'draft', -- draft, sent, approved, declined, expired, converted
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  shop_supplies numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  valid_until date,
  approval_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  sent_at timestamptz,
  approved_at timestamptz,
  declined_at timestamptz,
  decline_reason text,
  converted_to_invoice_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage estimates" ON public.estimates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers view own estimates" ON public.estimates FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers approve own estimates" ON public.estimates FOR UPDATE USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE TRIGGER estimates_updated_at BEFORE UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DVI: INSPECTIONS ============
CREATE TABLE public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  appointment_id uuid,
  technician_id uuid,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress, completed, sent
  share_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  summary_notes text,
  mileage integer,
  completed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inspections" ON public.inspections FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers view own inspections" ON public.inspections FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Technicians manage own inspections" ON public.inspections FOR ALL USING (technician_id = auth.uid() AND has_role(auth.uid(), 'technician')) WITH CHECK (technician_id = auth.uid() AND has_role(auth.uid(), 'technician'));
CREATE TRIGGER inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category text NOT NULL, -- e.g. 'Under Hood', 'Brakes', 'Tires'
  item_name text NOT NULL,
  status text NOT NULL DEFAULT 'na', -- green, yellow, red, na
  notes text,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inspection items" ON public.inspection_items FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers view own inspection items" ON public.inspection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND (i.customer_id = auth.uid() OR has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Technicians manage assigned inspection items" ON public.inspection_items FOR ALL USING (
  has_role(auth.uid(), 'technician') AND EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.technician_id = auth.uid())
) WITH CHECK (
  has_role(auth.uid(), 'technician') AND EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.technician_id = auth.uid())
);

-- Storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Inspection photos are public" ON storage.objects FOR SELECT USING (bucket_id = 'inspection-photos');
CREATE POLICY "Staff upload inspection photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'inspection-photos' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'technician'))
);
CREATE POLICY "Admins delete inspection photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'inspection-photos' AND has_role(auth.uid(), 'admin')
);

-- ============ CATALOG (parts/labor/kits) + INVENTORY ============
CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'part', -- part, labor, kit, fee
  sku text,
  name text NOT NULL,
  description text,
  category text,
  unit_price numeric NOT NULL DEFAULT 0,
  cost numeric DEFAULT 0,
  labor_hours numeric, -- for labor type: standard hours
  -- Inventory
  track_inventory boolean NOT NULL DEFAULT false,
  on_hand integer DEFAULT 0,
  reorder_point integer DEFAULT 0,
  vendor text,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage catalog" ON public.catalog_items FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff view catalog" ON public.catalog_items FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'technician')
);
CREATE TRIGGER catalog_items_updated_at BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_catalog_items_type ON public.catalog_items(type);
CREATE INDEX idx_catalog_items_active ON public.catalog_items(is_active);

-- ============ LABOR RATES ============
CREATE TABLE public.labor_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hourly_rate numeric NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.labor_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage labor rates" ON public.labor_rates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff view labor rates" ON public.labor_rates FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'technician')
);

-- Seed a default labor rate
INSERT INTO public.labor_rates (name, hourly_rate, is_default) VALUES ('Standard Labor', 125, true);

-- ============ SHOP SETTINGS ============
CREATE TABLE public.shop_settings (
  id integer PRIMARY KEY DEFAULT 1,
  tax_rate numeric NOT NULL DEFAULT 0.07,
  shop_supplies_pct numeric NOT NULL DEFAULT 0.05,
  shop_supplies_max numeric NOT NULL DEFAULT 50,
  estimate_valid_days integer NOT NULL DEFAULT 14,
  CONSTRAINT shop_settings_singleton CHECK (id = 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage shop settings" ON public.shop_settings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff view shop settings" ON public.shop_settings FOR SELECT USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'technician')
);
INSERT INTO public.shop_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
