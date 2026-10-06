CREATE OR REPLACE FUNCTION public.tech_has_current_customer(_user_id uuid, _customer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.customer_id = _customer AND a.assigned_technician_id = _user_id
      AND a.status NOT IN ('cancelled','canceled','declined','no_show')
      AND (a.status NOT IN ('completed','done','closed') OR a.updated_at > now() - interval '7 days'))
$$;
CREATE OR REPLACE FUNCTION public.tech_has_current_vehicle(_user_id uuid, _vehicle uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.vehicle_id = _vehicle AND a.assigned_technician_id = _user_id
      AND a.status NOT IN ('cancelled','canceled','declined','no_show')
      AND (a.status NOT IN ('completed','done','closed') OR a.updated_at > now() - interval '7 days'))
$$;
GRANT EXECUTE ON FUNCTION public.tech_has_current_customer(uuid,uuid), public.tech_has_current_vehicle(uuid,uuid) TO authenticated;

DROP POLICY IF EXISTS "Technicians view assigned customer profiles" ON public.profiles;
CREATE POLICY "Technicians view current assigned customer profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.tech_has_current_customer(auth.uid(), id));
DROP POLICY IF EXISTS "Technicians view assigned vehicles" ON public.vehicles;
CREATE POLICY "Technicians view current assigned vehicles" ON public.vehicles FOR SELECT TO authenticated
  USING (public.tech_has_current_vehicle(auth.uid(), id));

CREATE OR REPLACE FUNCTION public.my_tech_earnings(_from date, _to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _rate numeric; _rows jsonb;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid,'technician') THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT COALESCE((SELECT e.hourly_rate FROM employees e WHERE e.user_id = _uid AND e.hourly_rate > 0 LIMIT 1),
                  (SELECT t.hourly_rate FROM technician_agreements t WHERE t.tech_user_id = _uid ORDER BY created_at DESC LIMIT 1), 40) INTO _rate;
  WITH jobs AS (
    SELECT a.id, COALESCE(a.scheduled_at, a.created_at) AS job_at, a.service_type,
      COALESCE((SELECT sum(COALESCE((li->>'labor_hours')::numeric,0)) FROM invoices i, jsonb_array_elements(i.line_items) li
                WHERE i.appointment_id = a.id AND li->>'kind' = 'labor' AND COALESCE(li->>'status','approved') <> 'declined'),0) AS hours
    FROM appointments a
    WHERE a.assigned_technician_id = _uid AND a.status IN ('completed','done','closed')
      AND COALESCE(a.scheduled_at, a.created_at)::date BETWEEN _from AND _to)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'date',job_at,'service',service_type,'hours',hours,'pay',round(hours*_rate,2)) ORDER BY job_at DESC),'[]') INTO _rows FROM jobs;
  RETURN jsonb_build_object('rate',_rate,'jobs',_rows,
    'hours',(SELECT COALESCE(sum((j->>'hours')::numeric),0) FROM jsonb_array_elements(_rows) j),
    'pay',(SELECT COALESCE(sum((j->>'pay')::numeric),0) FROM jsonb_array_elements(_rows) j));
END $$;
REVOKE ALL ON FUNCTION public.my_tech_earnings(date,date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_tech_earnings(date,date) TO authenticated;