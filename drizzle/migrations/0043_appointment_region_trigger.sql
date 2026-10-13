CREATE OR REPLACE FUNCTION public.set_appointment_region()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.service_address IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.service_address IS DISTINCT FROM OLD.service_address) THEN
    NEW.region_slug := public.region_for_address(NEW.service_address);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_region BEFORE INSERT OR UPDATE OF service_address ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_appointment_region();