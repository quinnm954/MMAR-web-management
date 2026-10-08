ALTER TABLE public.review_feedback ADD COLUMN IF NOT EXISTS customer_id uuid;
CREATE OR REPLACE FUNCTION public.submit_review_feedback(_rating integer, _comments text, _name text, _phone text, _email text, _customer_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _cid uuid := COALESCE(auth.uid(), _customer_id); _p record;
BEGIN
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'invalid rating'; END IF;
  IF _cid IS NOT NULL THEN
    SELECT id, full_name, phone, email INTO _p FROM profiles WHERE id = _cid;
    IF NOT FOUND THEN _cid := NULL; END IF;
  END IF;
  INSERT INTO review_feedback(rating, comments, name, phone, email, customer_id)
  VALUES (_rating, NULLIF(left(_comments,2000),''),
    COALESCE(NULLIF(left(_name,100),''), _p.full_name),
    COALESCE(NULLIF(left(_phone,30),''), _p.phone),
    COALESCE(NULLIF(left(_email,255),''), _p.email), _cid)
  RETURNING id INTO _id;
  RETURN _id;
END $$;
GRANT EXECUTE ON FUNCTION public.submit_review_feedback(integer,text,text,text,text,uuid) TO anon, authenticated;
DROP FUNCTION IF EXISTS public.submit_review_feedback(integer,text,text,text,text);