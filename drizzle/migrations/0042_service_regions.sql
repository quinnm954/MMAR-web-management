CREATE TABLE public.service_regions (
  slug text PRIMARY KEY,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  cities text[] NOT NULL DEFAULT '{}',
  zip_prefixes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_regions TO anon, authenticated;
GRANT UPDATE ON public.service_regions TO authenticated;
GRANT ALL ON public.service_regions TO service_role;
ALTER TABLE public.service_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads regions" ON public.service_regions FOR SELECT USING (true);
CREATE POLICY "Admins update regions" ON public.service_regions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.service_regions (slug,name,active,cities,zip_prefixes) VALUES
 ('swfl','Southwest Florida',true,ARRAY['Fort Myers','Lehigh Acres'],ARRAY['339']),
 ('sfl','South Florida (Broward & Palm Beach)',false,ARRAY['Fort Lauderdale','Hollywood','Pembroke Pines','Coral Springs','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach'],ARRAY['330','331','333','334']);

CREATE TABLE public.user_service_regions (
  user_id uuid NOT NULL,
  region_slug text NOT NULL REFERENCES public.service_regions(slug) ON DELETE CASCADE,
  PRIMARY KEY (user_id, region_slug)
);
GRANT SELECT, INSERT, DELETE ON public.user_service_regions TO authenticated;
GRANT ALL ON public.user_service_regions TO service_role;
ALTER TABLE public.user_service_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tech regions" ON public.user_service_regions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users read own regions" ON public.user_service_regions FOR SELECT TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.appointments ADD COLUMN region_slug text NOT NULL DEFAULT 'swfl' REFERENCES public.service_regions(slug);
ALTER TABLE public.booking_requests ADD COLUMN region_slug text NOT NULL DEFAULT 'swfl' REFERENCES public.service_regions(slug);
ALTER TABLE public.calendar_blocks ADD COLUMN region_slug text REFERENCES public.service_regions(slug);

CREATE OR REPLACE FUNCTION public.region_for_address(_addr text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT r.slug FROM public.service_regions r
    WHERE EXISTS (SELECT 1 FROM unnest(r.zip_prefixes) p WHERE _addr ~ ('\m' || p || '\d{2}\M'))
       OR EXISTS (SELECT 1 FROM unnest(r.cities) c WHERE _addr ILIKE '%' || c || '%')
    ORDER BY (r.slug = 'swfl') LIMIT 1), 'swfl')
$$;

CREATE OR REPLACE FUNCTION public.set_booking_region()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.service_address IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.service_address IS DISTINCT FROM OLD.service_address) THEN
    NEW.region_slug := public.region_for_address(NEW.service_address);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER booking_requests_region BEFORE INSERT OR UPDATE OF service_address ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.set_booking_region();