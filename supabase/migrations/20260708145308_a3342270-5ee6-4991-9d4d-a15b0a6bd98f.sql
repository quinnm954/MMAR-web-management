
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text,
  link text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'owner')
    OR public.has_role(auth.uid(), 'technician')
    OR user_id = auth.uid()
  );

CREATE POLICY "Staff read all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'owner')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _body text,
  _category text DEFAULT NULL,
  _link text DEFAULT NULL,
  _data jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _pref record;
  _allowed boolean := true;
BEGIN
  SELECT * INTO _pref FROM public.notification_preferences WHERE user_id = _user_id;
  IF _pref IS NOT NULL AND _category IS NOT NULL THEN
    EXECUTE format('SELECT ($1).%I', _category) INTO _allowed USING _pref;
    IF _allowed IS FALSE THEN
      RETURN NULL;
    END IF;
  END IF;
  INSERT INTO public.notifications (user_id, title, body, category, link, data)
  VALUES (_user_id, _title, _body, _category, _link, COALESCE(_data, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO public.notifications (user_id, title, body, category, link, data)
  VALUES (_user_id, _title, _body, _category, _link, COALESCE(_data, '{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,jsonb) TO authenticated, service_role;
