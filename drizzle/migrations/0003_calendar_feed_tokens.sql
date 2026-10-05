CREATE TABLE public.calendar_feed_tokens (
  user_id uuid PRIMARY KEY,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.calendar_feed_tokens TO authenticated;
GRANT ALL ON public.calendar_feed_tokens TO service_role;
ALTER TABLE public.calendar_feed_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own feed token" ON public.calendar_feed_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_calendar_feed_token(_rotate boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF _rotate THEN DELETE FROM public.calendar_feed_tokens WHERE user_id = auth.uid(); END IF;
  INSERT INTO public.calendar_feed_tokens(user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;
  SELECT token INTO t FROM public.calendar_feed_tokens WHERE user_id = auth.uid();
  RETURN t;
END $$;
REVOKE EXECUTE ON FUNCTION public.get_calendar_feed_token(boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_calendar_feed_token(boolean) TO authenticated;