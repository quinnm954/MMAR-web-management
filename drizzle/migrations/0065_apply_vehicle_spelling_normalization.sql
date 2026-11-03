CREATE OR REPLACE FUNCTION public.vehicle_name_distance(a text,b text) RETURNS integer LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$ DECLARE prev integer[]; i integer; j integer; corner integer; old integer; BEGIN IF length(a)>120 OR length(b)>120 THEN RETURN 999; END IF; SELECT array_agg(x) INTO prev FROM generate_series(0,length(b)) x; IF length(a)=0 THEN RETURN length(b); END IF; FOR i IN 1..length(a) LOOP corner=prev[1]; prev[1]=i; IF length(b)>0 THEN FOR j IN 1..length(b) LOOP old=prev[j+1]; prev[j+1]=least(prev[j+1]+1,prev[j]+1,corner+CASE WHEN substr(a,i,1)=substr(b,j,1) THEN 0 ELSE 1 END); corner=old; END LOOP; END IF; END LOOP; RETURN prev[length(b)+1]; END $$;
REVOKE ALL ON FUNCTION public.vehicle_name_distance(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.vehicle_name_distance(text,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.normalize_vehicle_names() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a record; canonical text; candidates text[]; best record; next_distance integer; k text;
BEGIN
 SELECT * INTO a FROM public.vehicle_name_aliases WHERE make_input=lower(btrim(NEW.make)) AND model_input=lower(btrim(NEW.model));
 IF FOUND THEN NEW.make=a.corrected_make; NEW.model=coalesce(a.corrected_model,NEW.model); END IF;
 SELECT * INTO a FROM public.vehicle_name_aliases WHERE make_input=lower(btrim(NEW.make)) AND model_input='';
 IF FOUND THEN NEW.make=a.corrected_make; END IF;
 SELECT make INTO canonical FROM public.vehicle_name_catalog WHERE lower(make)=lower(btrim(NEW.make)) LIMIT 1;
 IF canonical IS NOT NULL THEN NEW.make=canonical; END IF;
 k=regexp_replace(lower(NEW.model),'[^a-z0-9]','','g');
 SELECT array_agg(DISTINCT model) INTO candidates FROM public.vehicle_name_catalog WHERE make=NEW.make AND regexp_replace(lower(model),'[^a-z0-9]','','g')=k;
 IF cardinality(candidates)=1 THEN NEW.model=candidates[1]; RETURN NEW; END IF;
 IF length(k)>=5 AND k !~ '[0-9]' AND NOT EXISTS(SELECT 1 FROM public.vehicle_name_catalog WHERE make=NEW.make AND length(regexp_replace(lower(model),'[^a-z0-9]','','g'))>=3 AND k LIKE regexp_replace(lower(model),'[^a-z0-9]','','g')||'%') THEN
 SELECT model,public.vehicle_name_distance(k,regexp_replace(lower(model),'[^a-z0-9]','','g')) d INTO best FROM public.vehicle_name_catalog WHERE make=NEW.make ORDER BY d,model LIMIT 1;
 IF best.d<=2 THEN
 SELECT min(public.vehicle_name_distance(k,regexp_replace(lower(model),'[^a-z0-9]','','g'))) INTO next_distance FROM public.vehicle_name_catalog WHERE make=NEW.make AND model<>best.model;
 IF next_distance IS NULL OR next_distance>=best.d+2 THEN NEW.model=best.model; END IF;
 END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.normalize_vehicle_names() FROM PUBLIC, anon, authenticated;