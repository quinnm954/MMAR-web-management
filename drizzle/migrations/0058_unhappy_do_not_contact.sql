ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS do_not_contact_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS do_not_contact_open_job_ids uuid[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public._customer_for_feedback(_customer_id uuid, _phone text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(_customer_id, (SELECT id FROM profiles
    WHERE length(right(regexp_replace(coalesce(_phone,''),'\D','','g'),10)) = 10
      AND right(regexp_replace(coalesce(phone,''),'\D','','g'),10) = right(regexp_replace(_phone,'\D','','g'),10)
    ORDER BY created_at LIMIT 1))
$$;

CREATE OR REPLACE FUNCTION public._open_job_ids(_customer_id uuid)
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(array_agg(id), '{}') FROM (
    SELECT id FROM appointments WHERE customer_id = _customer_id AND status NOT IN ('completed','cancelled')
    UNION ALL SELECT id FROM estimates WHERE customer_id = _customer_id AND status NOT IN ('completed','declined','expired')
    UNION ALL SELECT id FROM invoices WHERE customer_id = _customer_id AND status NOT IN ('paid','refunded','void')
  ) j
$$;

CREATE OR REPLACE FUNCTION public.apply_feedback_contact_block()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid; _happy boolean;
BEGIN
  _cid := public._customer_for_feedback(NEW.customer_id, NEW.phone);
  IF _cid IS NULL THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'customer_satisfaction_feedback' THEN _happy := NEW.satisfied;
  ELSE IF NEW.rating IS NULL THEN RETURN NEW; END IF; _happy := NEW.rating >= 4; END IF;
  IF _happy THEN
    UPDATE profiles SET do_not_contact_at = NULL, do_not_contact_open_job_ids = '{}' WHERE id = _cid;
  ELSE
    UPDATE profiles SET do_not_contact_at = now(), do_not_contact_open_job_ids = public._open_job_ids(_cid) WHERE id = _cid;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS feedback_contact_block ON public.customer_satisfaction_feedback;
CREATE TRIGGER feedback_contact_block AFTER INSERT ON public.customer_satisfaction_feedback FOR EACH ROW EXECUTE FUNCTION public.apply_feedback_contact_block();
DROP TRIGGER IF EXISTS feedback_contact_block ON public.review_feedback;
CREATE TRIGGER feedback_contact_block AFTER INSERT ON public.review_feedback FOR EACH ROW EXECUTE FUNCTION public.apply_feedback_contact_block();

-- Server check: is this person blocked from automated contact? Open jobs at block time stay allowed.
CREATE OR REPLACE FUNCTION public.contact_blocked(_phone text DEFAULT NULL, _email text DEFAULT NULL, _customer_id uuid DEFAULT NULL, _job_ids uuid[] DEFAULT '{}')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.do_not_contact_at IS NOT NULL
      AND (p.id = _customer_id
        OR (length(right(regexp_replace(coalesce(_phone,''),'\D','','g'),10)) = 10
            AND right(regexp_replace(coalesce(p.phone,''),'\D','','g'),10) = right(regexp_replace(_phone,'\D','','g'),10))
        OR (coalesce(_email,'') <> '' AND lower(p.email) = lower(_email)))
      AND NOT (coalesce(_job_ids,'{}') && p.do_not_contact_open_job_ids)
  )
$$;
REVOKE ALL ON FUNCTION public.contact_blocked(text,text,uuid,uuid[]) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.contact_blocked(text,text,uuid,uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public._open_job_ids(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public._customer_for_feedback(uuid,text) FROM public, anon, authenticated;

-- Admin toggle
CREATE OR REPLACE FUNCTION public.set_customer_contact_block(_customer_id uuid, _blocked boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  UPDATE profiles SET do_not_contact_at = CASE WHEN _blocked THEN now() END,
    do_not_contact_open_job_ids = CASE WHEN _blocked THEN public._open_job_ids(_customer_id) ELSE '{}' END
  WHERE id = _customer_id;
END $$;
REVOKE ALL ON FUNCTION public.set_customer_contact_block(uuid,boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_customer_contact_block(uuid,boolean) TO authenticated;

-- Backfill: customers whose newest answer is unhappy
UPDATE public.profiles p SET do_not_contact_at = now(), do_not_contact_open_job_ids = public._open_job_ids(p.id)
FROM (SELECT DISTINCT ON (cid) cid, happy FROM (
  SELECT public._customer_for_feedback(customer_id, phone) cid, satisfied happy, created_at FROM public.customer_satisfaction_feedback
  UNION ALL SELECT public._customer_for_feedback(customer_id, phone), rating >= 4, created_at FROM public.review_feedback WHERE rating IS NOT NULL
) x WHERE cid IS NOT NULL ORDER BY cid, created_at DESC) l
WHERE l.cid = p.id AND NOT l.happy;