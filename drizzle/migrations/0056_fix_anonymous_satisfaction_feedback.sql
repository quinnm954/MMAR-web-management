CREATE OR REPLACE FUNCTION public.submit_satisfaction_feedback(_satisfied boolean, _comments text DEFAULT NULL, _name text DEFAULT NULL, _phone text DEFAULT NULL, _email text DEFAULT NULL, _customer_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _cid uuid := COALESCE(auth.uid(), _customer_id); _pname text; _pphone text; _pemail text;
BEGIN
 IF _satisfied IS NULL THEN RAISE EXCEPTION 'Please answer Yes or No'; END IF;
 IF _cid IS NOT NULL THEN
  SELECT full_name, phone, email INTO _pname, _pphone, _pemail FROM public.profiles WHERE id = _cid;
  IF NOT FOUND THEN _cid := NULL; END IF;
 END IF;
 INSERT INTO public.customer_satisfaction_feedback(satisfied, comments, name, phone, email, customer_id)
 VALUES (_satisfied, NULLIF(left(btrim(_comments),2000),''), COALESCE(NULLIF(left(btrim(_name),100),''),_pname), COALESCE(NULLIF(left(btrim(_phone),30),''),_pphone), COALESCE(NULLIF(left(btrim(_email),255),''),_pemail), _cid) RETURNING id INTO _id;
 RETURN _id;
END;
$$;