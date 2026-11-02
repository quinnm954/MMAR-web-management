CREATE TABLE public.competitor_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  thread_id uuid,
  phone text,
  image_path text NOT NULL,
  source_name text,
  itemized boolean NOT NULL DEFAULT false,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric,
  customer_name text,
  address text,
  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  status text NOT NULL DEFAULT 'pending',
  matched_by uuid,
  matched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competitor_quotes TO authenticated;
GRANT ALL ON public.competitor_quotes TO service_role;
ALTER TABLE public.competitor_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner/admin manage competitor quotes" ON public.competitor_quotes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE INDEX competitor_quotes_estimate_idx ON public.competitor_quotes(estimate_id);
CREATE INDEX competitor_quotes_customer_idx ON public.competitor_quotes(customer_id);