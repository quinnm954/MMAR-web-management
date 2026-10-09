CREATE OR REPLACE FUNCTION public.invoice_tech_hours(_items jsonb) RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT COALESCE(sum(CASE
    WHEN COALESCE(li->>'status','approved') = 'declined' THEN 0
    WHEN lower(COALESCE(li->>'kind','')) IN ('diagnosis','diagnostic')
      OR lower(COALESCE(li->>'name','') || ' ' || COALESCE(li->>'description','')) ~ '(diagnos|\mdiag\M)' THEN 1
    WHEN lower(COALESCE(li->>'kind','')) = 'labor' THEN
      CASE WHEN COALESCE((li->>'labor_hours')::numeric,0) > 0 THEN (li->>'labor_hours')::numeric
           ELSE COALESCE((li->>'amount')::numeric, COALESCE((li->>'quantity')::numeric,1) * COALESCE((li->>'unit_price')::numeric,0)) / 125 END
    ELSE 0 END),0)
  FROM jsonb_array_elements(COALESCE(_items,'[]'::jsonb)) li
$$;

CREATE OR REPLACE FUNCTION public.my_tech_earnings(_from date, _to date)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _rate numeric; _rows jsonb;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid,'technician') THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT COALESCE((SELECT e.hourly_rate FROM employees e WHERE e.user_id = _uid AND e.hourly_rate > 0 LIMIT 1),
                  (SELECT t.hourly_rate FROM technician_agreements t WHERE t.tech_user_id = _uid ORDER BY created_at DESC LIMIT 1), 40) INTO _rate;
  WITH jobs AS (
    SELECT a.id, COALESCE(a.completed_at, a.scheduled_at, a.created_at) AS job_at, a.service_type,
      COALESCE((SELECT sum(public.invoice_tech_hours(i.line_items)) FROM invoices i
                WHERE i.appointment_id = a.id AND i.status = 'paid'),0) AS hours
    FROM appointments a
    WHERE a.assigned_technician_id = _uid AND a.status IN ('completed','done','closed')
      AND COALESCE(a.completed_at, a.scheduled_at, a.created_at)::date BETWEEN _from AND _to)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'date',job_at,'service',service_type,'hours',hours,'pay',round(hours*_rate,2)) ORDER BY job_at DESC),'[]') INTO _rows FROM jobs;
  RETURN jsonb_build_object('rate',_rate,'jobs',_rows,
    'hours',(SELECT COALESCE(sum((j->>'hours')::numeric),0) FROM jsonb_array_elements(_rows) j),
    'pay',(SELECT COALESCE(sum((j->>'pay')::numeric),0) FROM jsonb_array_elements(_rows) j));
END $function$;