CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _body text,
  _category text DEFAULT NULL::text,
  _link text DEFAULT NULL::text,
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  PERFORM public._send_push(_user_id, _title, COALESCE(_body, ''), _category, _link);

  RETURN _id;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO public.notifications (user_id, title, body, category, link, data)
  VALUES (_user_id, _title, _body, _category, _link, COALESCE(_data, '{}'::jsonb))
  RETURNING id INTO _id;

  PERFORM public._send_push(_user_id, _title, COALESCE(_body, ''), _category, _link);

  RETURN _id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_notification(uuid,text,text,text,text,jsonb) TO authenticated, service_role;