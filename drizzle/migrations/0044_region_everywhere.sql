ALTER TABLE public.service_regions ADD COLUMN IF NOT EXISTS counties text[] NOT NULL DEFAULT '{}';
INSERT INTO public.service_regions (slug,name,active,cities,zip_prefixes) VALUES ('outside','Outside service area',false,'{}','{}') ON CONFLICT (slug) DO NOTHING;
UPDATE public.service_regions SET counties = ARRAY['Lee County'] WHERE slug='swfl';
UPDATE public.service_regions SET counties = ARRAY['Broward County','Palm Beach County'] WHERE slug='sfl';

ALTER TABLE public.booking_requests ADD COLUMN geo_city text, ADD COLUMN geo_county text, ADD COLUMN geo_lat double precision, ADD COLUMN geo_lng double precision, ADD COLUMN geo_status text NOT NULL DEFAULT 'pending', ADD COLUMN geo_source text;
ALTER TABLE public.appointments ADD COLUMN geo_city text, ADD COLUMN geo_county text, ADD COLUMN geo_lat double precision, ADD COLUMN geo_lng double precision, ADD COLUMN geo_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN region_slug text REFERENCES public.service_regions(slug);
ALTER TABLE public.estimates ADD COLUMN region_slug text NOT NULL DEFAULT 'swfl' REFERENCES public.service_regions(slug);
ALTER TABLE public.invoices ADD COLUMN region_slug text NOT NULL DEFAULT 'swfl' REFERENCES public.service_regions(slug);

-- Keep address-text guess only until geocoding (or a manual choice) settles it.
CREATE OR REPLACE FUNCTION public.set_booking_region()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.geo_status IN ('ok','manual') AND TG_OP = 'UPDATE' AND NEW.service_address IS NOT DISTINCT FROM OLD.service_address THEN RETURN NEW; END IF;
  IF NEW.service_address IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.service_address IS DISTINCT FROM OLD.service_address) THEN
    NEW.region_slug := public.region_for_address(NEW.service_address);
    IF TG_OP = 'UPDATE' AND NEW.geo_status <> 'manual' THEN NEW.geo_status := 'pending'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.set_appointment_region()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.service_address IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.service_address IS DISTINCT FROM OLD.service_address) THEN
    IF NOT (TG_OP='UPDATE' AND NEW.geo_status='manual') THEN
      NEW.region_slug := public.region_for_address(NEW.service_address);
      IF TG_OP = 'UPDATE' THEN NEW.geo_status := 'pending'; END IF;
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    NEW.region_slug := COALESCE((SELECT region_slug FROM public.profiles WHERE id = NEW.customer_id), NEW.region_slug);
  END IF;
  RETURN NEW;
END $$;

-- Estimates and invoices inherit region from the appointment, else customer.
CREATE OR REPLACE FUNCTION public.inherit_doc_region()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.appointment_id IS DISTINCT FROM OLD.appointment_id OR NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    NEW.region_slug := COALESCE(
      (SELECT region_slug FROM public.appointments WHERE id = NEW.appointment_id),
      (SELECT region_slug FROM public.profiles WHERE id = NEW.customer_id),
      NEW.region_slug, 'swfl');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER estimates_region BEFORE INSERT OR UPDATE OF appointment_id, customer_id ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.inherit_doc_region();
CREATE TRIGGER invoices_region BEFORE INSERT OR UPDATE OF appointment_id, customer_id ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.inherit_doc_region();

CREATE OR REPLACE FUNCTION public.cascade_appointment_region()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.region_slug IS DISTINCT FROM OLD.region_slug THEN
    UPDATE public.estimates SET region_slug = NEW.region_slug WHERE appointment_id = NEW.id;
    UPDATE public.invoices SET region_slug = NEW.region_slug WHERE appointment_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_region_cascade AFTER UPDATE OF region_slug ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.cascade_appointment_region();

-- Backfill from appointments/customers.
UPDATE public.estimates e SET region_slug = a.region_slug FROM public.appointments a WHERE a.id = e.appointment_id;
UPDATE public.invoices i SET region_slug = a.region_slug FROM public.appointments a WHERE a.id = i.appointment_id;

-- Public booking form can pass device location.
CREATE OR REPLACE FUNCTION public.set_booking_location(_token text, _lat double precision, _lng double precision)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.booking_requests SET geo_lat = _lat, geo_lng = _lng, geo_source = 'device', geo_status = 'pending'
  WHERE confirmation_token = _token AND created_at > now() - interval '30 minutes'
    AND _lat BETWEEN 24 AND 31.5 AND _lng BETWEEN -88 AND -79.5;
$$;
GRANT EXECUTE ON FUNCTION public.set_booking_location(text, double precision, double precision) TO anon, authenticated;