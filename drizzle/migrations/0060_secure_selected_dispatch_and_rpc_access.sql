CREATE TABLE public.internal_dispatch_credentials (
 id integer PRIMARY KEY DEFAULT 1,
 token text NOT NULL DEFAULT (gen_random_uuid()::text || gen_random_uuid()::text)
);
GRANT ALL ON public.internal_dispatch_credentials TO service_role;
REVOKE ALL ON public.internal_dispatch_credentials FROM anon, authenticated;
ALTER TABLE public.internal_dispatch_credentials ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_dispatch_credentials (id) SELECT 1;

CREATE FUNCTION public.internal_dispatch_headers() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT jsonb_build_object('Content-Type','application/json','x-internal-token',token) FROM public.internal_dispatch_credentials WHERE id=1 $$;
REVOKE ALL ON FUNCTION public.internal_dispatch_headers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.internal_dispatch_headers() TO service_role;

DO $$
DECLARE r record; d text;
BEGIN
 FOR r IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('_send_push','_send_tech_job_assigned_email','start_booking_bot','request_receptionist_sync') LOOP
  d := pg_get_functiondef(r.oid);
  d := regexp_replace(d, 'headers\s*:=.*?,\s*body\s*:=', 'headers := public.internal_dispatch_headers(), body :=', 'gs');
  EXECUTE d;
 END LOOP;
 FOR r IN SELECT jobid,command FROM cron.job WHERE command ~ '(outlook-inbox-sync|followup-worker|prospect-email-worker|send-mileage-email-reminders)' LOOP
  d := regexp_replace(r.command, 'headers\s*:=.*?,\s*body\s*:=', 'headers := public.internal_dispatch_headers(), body :=', 'gs');
  PERFORM cron.alter_job(r.jobid, command := d);
 END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public._send_push(uuid,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public._send_tech_job_assigned_email(uuid) FROM PUBLIC,anon,authenticated;

DO $$
DECLARE d text;
BEGIN
 d := pg_get_functiondef('public.create_notification(uuid,text,text,text,text,jsonb)'::regprocedure);
 d := replace(d, 'BEGIN', 'BEGIN
  IF pg_trigger_depth() = 0 AND COALESCE(auth.role(), '''') <> ''service_role'' AND NOT (public.has_role(auth.uid(), ''admin''::public.app_role) OR public.has_role(auth.uid(), ''owner''::public.app_role)) THEN
    RAISE EXCEPTION ''Not authorized'' USING ERRCODE = ''42501'';
  END IF;');
 EXECUTE d;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,jsonb) TO authenticated,service_role;

DO $$
DECLARE d text;
BEGIN
 d := pg_get_functiondef('public.create_checklist_from_template(uuid,uuid,uuid,uuid,uuid,uuid,text)'::regprocedure);
 d := replace(d, '  SELECT * INTO v_tpl', '  IF NOT public.has_role(auth.uid(), ''admin''::public.app_role) THEN
    IF _appointment_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.appointments a WHERE a.id=_appointment_id AND a.customer_id=_customer_id AND a.assigned_technician_id=auth.uid()
        AND (_vehicle_id IS NULL OR a.vehicle_id=_vehicle_id)
        AND (_membership_id IS NULL OR a.membership_id=_membership_id)
    ) OR (_assigned_technician_id IS NOT NULL AND _assigned_technician_id <> auth.uid()) THEN
      RAISE EXCEPTION ''Not authorized for this appointment'' USING ERRCODE = ''42501'';
    END IF;
    _assigned_technician_id := auth.uid();
  END IF;
  IF _vehicle_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id=_vehicle_id AND owner_id=_customer_id) THEN
    RAISE EXCEPTION ''Vehicle does not belong to customer'';
  END IF;
  IF _membership_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.memberships WHERE id=_membership_id AND customer_id=_customer_id) THEN
    RAISE EXCEPTION ''Membership does not belong to customer'';
  END IF;
  IF _appointment_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.appointments WHERE id=_appointment_id AND customer_id=_customer_id) THEN
    RAISE EXCEPTION ''Appointment does not belong to customer'';
  END IF;
  SELECT * INTO v_tpl');
 EXECUTE d;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_checklist_from_template(uuid,uuid,uuid,uuid,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_checklist_from_template(uuid,uuid,uuid,uuid,uuid,uuid,text) TO authenticated,service_role;

DROP POLICY "Public can read social cache" ON public.social_cache;
CREATE POLICY "Admins read social cache" ON public.social_cache FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'owner'::public.app_role));