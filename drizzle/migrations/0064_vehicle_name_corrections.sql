CREATE TABLE public.vehicle_name_catalog (make text NOT NULL, model text NOT NULL, PRIMARY KEY(make, model));
GRANT SELECT ON public.vehicle_name_catalog TO authenticated;
GRANT ALL ON public.vehicle_name_catalog TO service_role;
ALTER TABLE public.vehicle_name_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read vehicle spelling catalogue" ON public.vehicle_name_catalog FOR SELECT TO authenticated USING (true);
CREATE TABLE public.vehicle_name_aliases (make_input text NOT NULL, model_input text NOT NULL DEFAULT '', corrected_make text NOT NULL, corrected_model text, PRIMARY KEY(make_input, model_input));
GRANT SELECT ON public.vehicle_name_aliases TO authenticated;
GRANT ALL ON public.vehicle_name_aliases TO service_role;
ALTER TABLE public.vehicle_name_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read vehicle spelling aliases" ON public.vehicle_name_aliases FOR SELECT TO authenticated USING (true);
CREATE OR REPLACE FUNCTION public.normalize_vehicle_names() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a record; canonical text; candidates text[];
BEGIN
 IF TG_OP = 'UPDATE' AND NEW.make IS NOT DISTINCT FROM OLD.make AND NEW.model IS NOT DISTINCT FROM OLD.model THEN RETURN NEW; END IF;
 SELECT * INTO a FROM public.vehicle_name_aliases WHERE make_input=lower(btrim(NEW.make)) AND model_input=lower(btrim(NEW.model));
 IF FOUND THEN NEW.make=a.corrected_make; NEW.model=coalesce(a.corrected_model,NEW.model); RETURN NEW; END IF;
 SELECT * INTO a FROM public.vehicle_name_aliases WHERE make_input=lower(btrim(NEW.make)) AND model_input='';
 IF FOUND THEN NEW.make=a.corrected_make; END IF;
 SELECT make INTO canonical FROM public.vehicle_name_catalog WHERE lower(make)=lower(btrim(NEW.make)) LIMIT 1;
 IF canonical IS NOT NULL THEN NEW.make=canonical; END IF;
 SELECT array_agg(DISTINCT model) INTO candidates FROM public.vehicle_name_catalog WHERE make=NEW.make AND regexp_replace(lower(model),'[^a-z0-9]','','g')=regexp_replace(lower(NEW.model),'[^a-z0-9]','','g');
 IF cardinality(candidates)=1 THEN NEW.model=candidates[1]; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.normalize_vehicle_names() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER normalize_vehicle_names BEFORE INSERT OR UPDATE OF make,model ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.normalize_vehicle_names();