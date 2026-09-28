CREATE OR REPLACE FUNCTION public.register_fleet_for_me(
  _company_name text, _contact_name text, _phone text,
  _fleet_size integer, _vehicle_types text[], _yard_address text, _city text, _notes text, _sms_consent boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _email text; _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = _uid;
  IF length(coalesce(_company_name,'')) NOT BETWEEN 2 AND 120 OR length(coalesce(_contact_name,'')) NOT BETWEEN 2 AND 100
     OR length(coalesce(_phone,'')) NOT BETWEEN 10 AND 20 OR _fleet_size NOT BETWEEN 1 AND 5000
     OR length(coalesce(_yard_address,'')) NOT BETWEEN 5 AND 200 OR length(coalesce(_city,'')) NOT BETWEEN 2 AND 60
     OR length(coalesce(_notes,'')) > 1000 OR coalesce(array_length(_vehicle_types,1),0) > 10 THEN
    RAISE EXCEPTION 'Invalid fields';
  END IF;
  INSERT INTO public.fleet_accounts (user_id, company_name, contact_name, phone, email, fleet_size, vehicle_types, yard_address, city, notes, sms_consent)
  VALUES (_uid, _company_name, _contact_name, _phone, lower(_email), _fleet_size, coalesce(_vehicle_types,'{}'), _yard_address, _city, nullif(_notes,''), coalesce(_sms_consent,false))
  ON CONFLICT (user_id) DO NOTHING RETURNING id INTO _id;
  IF _id IS NULL THEN RAISE EXCEPTION 'You already have a fleet account'; END IF;
  PERFORM public._notify_staff_customer_action('New fleet sign-up', _company_name || ' · ' || _fleet_size || ' vehicles · ' || _city, '/admin/dashboard?tab=fleet-accounts');
  RETURN jsonb_build_object('ok', true, 'id', _id);
END $$;
REVOKE ALL ON FUNCTION public.register_fleet_for_me FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_fleet_for_me TO authenticated;