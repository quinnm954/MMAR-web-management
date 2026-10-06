ALTER TABLE public.technician_agreements ADD COLUMN IF NOT EXISTS tech_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS technician_agreements_tech_user_idx ON public.technician_agreements(tech_user_id);

CREATE OR REPLACE FUNCTION public.my_tech_agreement()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _emp record; _a record;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF public.has_role(_uid,'admin') OR NOT public.has_role(_uid,'technician') THEN
    RETURN jsonb_build_object('required', false);
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  SELECT * INTO _emp FROM public.employees WHERE user_id = _uid OR (email IS NOT NULL AND lower(email) = lower(_email)) ORDER BY (user_id = _uid) DESC NULLS LAST LIMIT 1;

  SELECT * INTO _a FROM public.technician_agreements
   WHERE tech_user_id = _uid
      OR (_emp.id IS NOT NULL AND employee_id = _emp.id)
      OR (tech_email IS NOT NULL AND lower(tech_email) = lower(_email))
   ORDER BY (tech_signed_at IS NOT NULL) DESC, created_at DESC LIMIT 1;

  IF _a.id IS NULL THEN
    INSERT INTO public.technician_agreements (tech_name, tech_email, tech_phone, employee_id, tech_user_id, hourly_rate)
    VALUES (COALESCE(_emp.full_name, split_part(_email,'@',1)), _email, _emp.phone, _emp.id, _uid, 40)
    RETURNING * INTO _a;
  ELSIF _a.tech_user_id IS NULL OR (_a.employee_id IS NULL AND _emp.id IS NOT NULL) THEN
    UPDATE public.technician_agreements SET tech_user_id = COALESCE(tech_user_id, _uid), employee_id = COALESCE(employee_id, _emp.id)
     WHERE id = _a.id RETURNING * INTO _a;
  END IF;

  RETURN jsonb_build_object('required', _a.tech_signed_at IS NULL, 'token', _a.token);
END $$;
REVOKE ALL ON FUNCTION public.my_tech_agreement() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_tech_agreement() TO authenticated;