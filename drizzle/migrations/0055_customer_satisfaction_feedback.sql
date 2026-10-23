CREATE TABLE public.customer_satisfaction_feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 satisfied boolean NOT NULL,
 comments text,
 name text,
 phone text,
 email text,
 customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','resolved')),
 admin_notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.customer_satisfaction_feedback TO authenticated;
GRANT ALL ON public.customer_satisfaction_feedback TO service_role;
ALTER TABLE public.customer_satisfaction_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read satisfaction feedback" ON public.customer_satisfaction_feedback FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update satisfaction feedback" ON public.customer_satisfaction_feedback FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.submit_satisfaction_feedback(_satisfied boolean, _comments text DEFAULT NULL, _name text DEFAULT NULL, _phone text DEFAULT NULL, _email text DEFAULT NULL, _customer_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _cid uuid := COALESCE(auth.uid(), _customer_id); _p record;
BEGIN
 IF _satisfied IS NULL THEN RAISE EXCEPTION 'Please answer Yes or No'; END IF;
 IF _cid IS NOT NULL THEN
  SELECT id, full_name, phone, email INTO _p FROM public.profiles WHERE id = _cid;
  IF NOT FOUND THEN _cid := NULL; END IF;
 END IF;
 INSERT INTO public.customer_satisfaction_feedback(satisfied, comments, name, phone, email, customer_id)
 VALUES (_satisfied, NULLIF(left(btrim(_comments),2000),''), COALESCE(NULLIF(left(btrim(_name),100),''),_p.full_name), COALESCE(NULLIF(left(btrim(_phone),30),''),_p.phone), COALESCE(NULLIF(left(btrim(_email),255),''),_p.email), _cid) RETURNING id INTO _id;
 RETURN _id;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_satisfaction_feedback(boolean,text,text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_satisfaction_feedback(boolean,text,text,text,text,uuid) TO anon, authenticated, service_role;