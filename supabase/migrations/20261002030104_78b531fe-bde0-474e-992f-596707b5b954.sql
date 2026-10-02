CREATE TABLE public.partstech_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  estimate_id UUID NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NULL,
  imported BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partstech_quotes TO authenticated;
GRANT ALL ON public.partstech_quotes TO service_role;
ALTER TABLE public.partstech_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage partstech quotes" ON public.partstech_quotes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text IN ('admin','manager','service_advisor','technician','parts')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text IN ('admin','manager','service_advisor','technician','parts')));
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS parts_markup_pct NUMERIC NOT NULL DEFAULT 35.0;
ALTER TABLE public.shop_settings ADD COLUMN IF NOT EXISTS partstech_enabled BOOLEAN NOT NULL DEFAULT true;