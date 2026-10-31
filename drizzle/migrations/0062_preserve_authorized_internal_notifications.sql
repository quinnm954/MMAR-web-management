DO $$
DECLARE d text; r record;
BEGIN
 d := pg_get_functiondef('public.create_notification(uuid,text,text,text,text,jsonb)'::regprocedure);
 d := replace(d, 'public.create_notification(', 'public.internal_create_notification(');
 d := regexp_replace(d, '  IF pg_trigger_depth\(\).*?END IF;', '', 's');
 EXECUTE d;
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname NOT IN ('create_notification','internal_create_notification') AND p.prosrc LIKE '%public.create_notification(%' LOOP
  d := replace(pg_get_functiondef(r.oid), 'public.create_notification(', 'public.internal_create_notification(');
  EXECUTE d;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.internal_create_notification(uuid,text,text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.internal_create_notification(uuid,text,text,text,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid,_title text,_body text,_category text DEFAULT NULL,_link text DEFAULT NULL,_data jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF COALESCE(auth.role(),'') <> 'service_role' AND NOT (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'owner'::public.app_role)) THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
 END IF;
 RETURN public.internal_create_notification(_user_id,_title,_body,_category,_link,_data);
END $$;