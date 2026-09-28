CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  city text NOT NULL,
  phone text, website text, email text, address text,
  rating numeric, review_count integer,
  stage text NOT NULL DEFAULT 'new',
  do_not_contact boolean NOT NULL DEFAULT false,
  notes text,
  email_subject text, email_body text, call_script text,
  email_status text NOT NULL DEFAULT 'none', -- none|draft|approved|sent|done
  email_step integer NOT NULL DEFAULT 0,
  next_email_at timestamptz,
  enriched_at timestamptz,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners/admins manage prospects" ON public.prospects FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE TRIGGER prospects_updated BEFORE UPDATE ON public.prospects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.prospect_touches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  channel text NOT NULL,
  outcome text,
  step integer,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prospect_id, channel, step)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_touches TO authenticated;
GRANT ALL ON public.prospect_touches TO service_role;
ALTER TABLE public.prospect_touches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners/admins manage touches" ON public.prospect_touches FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE TABLE public.prospect_pitches (
  category text PRIMARY KEY,
  email_subject text NOT NULL,
  email_body text NOT NULL,
  call_script text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_pitches TO authenticated;
GRANT ALL ON public.prospect_pitches TO service_role;
ALTER TABLE public.prospect_pitches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners/admins manage pitches" ON public.prospect_pitches FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE TABLE public.prospect_email_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paused boolean NOT NULL DEFAULT false,
  pause_reason text,
  lease_until timestamptz,
  sent_today integer NOT NULL DEFAULT 0,
  sent_day date,
  daily_cap integer NOT NULL DEFAULT 30,
  mailing_address text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.prospect_email_state (id) VALUES (1);
GRANT SELECT, UPDATE ON public.prospect_email_state TO authenticated;
GRANT ALL ON public.prospect_email_state TO service_role;
ALTER TABLE public.prospect_email_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners/admins manage email state" ON public.prospect_email_state FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));