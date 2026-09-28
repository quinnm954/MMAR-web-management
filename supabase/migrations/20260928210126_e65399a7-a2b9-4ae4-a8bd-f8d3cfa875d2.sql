CREATE TABLE public.fleet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  fleet_size integer NOT NULL,
  vehicle_types text[] NOT NULL DEFAULT '{}',
  yard_address text NOT NULL,
  city text NOT NULL,
  notes text,
  sms_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.fleet_accounts TO authenticated;
GRANT ALL ON public.fleet_accounts TO service_role;
ALTER TABLE public.fleet_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own fleet" ON public.fleet_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff manage fleets" ON public.fleet_accounts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER fleet_accounts_updated BEFORE UPDATE ON public.fleet_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.submit_fleet_registration(
  _user_id uuid, _company_name text, _contact_name text, _phone text, _email text,
  _fleet_size integer, _vehicle_types text[], _yard_address text, _city text, _notes text, _sms_consent boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id AND lower(email) = lower(_email) AND created_at > now() - interval '15 minutes') THEN
    RAISE EXCEPTION 'Invalid registration';
  END IF;
  IF length(coalesce(_company_name,'')) NOT BETWEEN 2 AND 120 OR length(coalesce(_contact_name,'')) NOT BETWEEN 2 AND 100
     OR length(coalesce(_phone,'')) NOT BETWEEN 10 AND 20 OR _fleet_size NOT BETWEEN 1 AND 5000
     OR length(coalesce(_yard_address,'')) NOT BETWEEN 5 AND 200 OR length(coalesce(_city,'')) NOT BETWEEN 2 AND 60
     OR length(coalesce(_notes,'')) > 1000 OR coalesce(array_length(_vehicle_types,1),0) > 10 THEN
    RAISE EXCEPTION 'Invalid fields';
  END IF;
  INSERT INTO public.fleet_accounts (user_id, company_name, contact_name, phone, email, fleet_size, vehicle_types, yard_address, city, notes, sms_consent)
  VALUES (_user_id, _company_name, _contact_name, _phone, lower(_email), _fleet_size, coalesce(_vehicle_types,'{}'), _yard_address, _city, nullif(_notes,''), coalesce(_sms_consent,false))
  ON CONFLICT (user_id) DO NOTHING RETURNING id INTO _id;
  IF _id IS NOT NULL THEN
    UPDATE public.profiles SET phone = coalesce(phone, _phone) WHERE id = _user_id;
    PERFORM public._notify_staff_customer_action('New fleet sign-up', _company_name || ' · ' || _fleet_size || ' vehicles · ' || _city, '/admin/dashboard?tab=customers');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', _id);
END $$;
REVOKE ALL ON FUNCTION public.submit_fleet_registration FROM public;
GRANT EXECUTE ON FUNCTION public.submit_fleet_registration TO anon, authenticated;