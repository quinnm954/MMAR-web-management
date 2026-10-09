CREATE OR REPLACE FUNCTION public.invoice_tech_hours(_items jsonb) RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path=public AS $$
  SELECT COALESCE(sum(CASE
    WHEN COALESCE(li->>'status','approved') = 'declined' THEN 0
    WHEN lower(COALESCE(li->>'kind','')) IN ('diagnosis','diagnostic')
      OR lower(COALESCE(li->>'name','') || ' ' || COALESCE(li->>'description','')) ~ '(diagnos|\mdiag\M)' THEN 1
    WHEN lower(COALESCE(li->>'kind','')) = 'labor' THEN COALESCE(
      NULLIF(GREATEST(COALESCE((li->>'hours')::numeric,0),0),0),
      NULLIF(GREATEST(COALESCE((li->>'quantity')::numeric,0),0),0),
      NULLIF(GREATEST(COALESCE((li->>'labor_hours')::numeric,0),0),0),
      COALESCE((li->>'amount')::numeric, COALESCE((li->>'unit_price')::numeric,0)) / 125)
    ELSE 0 END),0)
  FROM jsonb_array_elements(COALESCE(_items,'[]'::jsonb)) li
$$;