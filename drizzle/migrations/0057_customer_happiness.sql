CREATE OR REPLACE FUNCTION public.customer_happiness()
RETURNS TABLE(customer_id uuid, phone text, happy boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH f AS (
    SELECT customer_id, right(regexp_replace(coalesce(phone,''),'\D','','g'),10) AS p, satisfied AS happy, created_at
      FROM customer_satisfaction_feedback
    UNION ALL
    SELECT customer_id, right(regexp_replace(coalesce(phone,''),'\D','','g'),10), rating >= 4, created_at
      FROM review_feedback WHERE rating IS NOT NULL
  ), k AS (
    SELECT coalesce(customer_id::text, nullif(p,'')) AS key, customer_id, p, happy, created_at FROM f
  )
  SELECT DISTINCT ON (key) customer_id, nullif(p,''), happy
    FROM k WHERE key IS NOT NULL AND public.has_role(auth.uid(), 'admin')
   ORDER BY key, created_at DESC
$$;
REVOKE ALL ON FUNCTION public.customer_happiness() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.customer_happiness() TO authenticated;