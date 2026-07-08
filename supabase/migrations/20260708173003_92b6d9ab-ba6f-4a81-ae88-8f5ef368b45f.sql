
CREATE OR REPLACE FUNCTION public._send_push(
  _user_id uuid,
  _title text,
  _body text,
  _category text,
  _url text default null
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_native_url text := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/send-push';
  v_web_url    text := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/send-web-push';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc';
  v_unread integer;
begin
  if _user_id is null then return; end if;

  -- Native FCM push (existing behavior)
  perform net.http_post(
    url := v_native_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||v_key,
      'apikey', v_key
    ),
    body := jsonb_build_object(
      'user_id', _user_id,
      'title', _title,
      'body', COALESCE(_body, ''),
      'category', _category,
      'data', case when _url is not null then jsonb_build_object('url', _url) else '{}'::jsonb end
    )
  );

  -- Web Push (installed PWAs). Include badge count so the icon dot updates
  -- even when the app is closed.
  select count(*)::int into v_unread
    from public.notifications
    where user_id = _user_id and read_at is null;

  perform net.http_post(
    url := v_web_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||v_key,
      'apikey', v_key
    ),
    body := jsonb_build_object(
      'user_id', _user_id,
      'title', _title,
      'body', COALESCE(_body, ''),
      'category', _category,
      'url', _url,
      'badge_count', v_unread
    )
  );
exception when others then
  -- never break the originating transaction because of push failure
  null;
end;
$$;

REVOKE EXECUTE ON FUNCTION public._send_push(uuid, text, text, text, text) FROM public, anon, authenticated;
