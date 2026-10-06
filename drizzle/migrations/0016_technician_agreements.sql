CREATE TABLE public.technician_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(18), 'hex'),
  tech_name text NOT NULL,
  tech_phone text,
  tech_email text,
  tech_address text,
  cashapp_handle text,
  hourly_rate numeric NOT NULL DEFAULT 40,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'sent',
  company_signer_name text,
  company_signature text,
  company_signed_at timestamptz,
  tech_signature text,
  tech_initials jsonb NOT NULL DEFAULT '{}'::jsonb,
  tech_signed_name text,
  tech_signed_at timestamptz,
  tech_user_agent text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technician_agreements TO authenticated;
GRANT ALL ON public.technician_agreements TO service_role;
ALTER TABLE public.technician_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage technician agreements" ON public.technician_agreements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_technician_agreement(_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(t) - 'created_by' - 'tech_user_agent'
  FROM public.technician_agreements t WHERE t.token = _token LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.sign_technician_agreement(_token text, _signed_name text, _signature text, _initials jsonb, _user_agent text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.technician_agreements;
BEGIN
  SELECT * INTO r FROM public.technician_agreements WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Agreement not found'; END IF;
  IF r.tech_signed_at IS NOT NULL THEN RAISE EXCEPTION 'Agreement already signed'; END IF;
  IF coalesce(length(_signature),0) < 100 OR coalesce(btrim(_signed_name),'') = '' THEN
    RAISE EXCEPTION 'Signature and printed name are required';
  END IF;
  IF (SELECT count(*) FROM jsonb_object_keys(coalesce(_initials,'{}'::jsonb))) < 6 THEN
    RAISE EXCEPTION 'All initials are required';
  END IF;
  UPDATE public.technician_agreements SET
    tech_signature = _signature, tech_signed_name = btrim(_signed_name),
    tech_initials = _initials, tech_signed_at = now(), tech_user_agent = left(_user_agent, 400),
    status = CASE WHEN company_signed_at IS NOT NULL THEN 'completed' ELSE 'tech_signed' END,
    updated_at = now()
  WHERE id = r.id;
  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.get_technician_agreement(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_technician_agreement(text, text, text, jsonb, text) TO anon, authenticated;