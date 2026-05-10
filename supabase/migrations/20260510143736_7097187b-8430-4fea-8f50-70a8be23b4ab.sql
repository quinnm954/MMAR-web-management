
CREATE OR REPLACE FUNCTION public.set_booking_attribution(_token text, _attribution jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.booking_requests
     SET gclid         = COALESCE(NULLIF(_attribution->>'gclid',''),         gclid),
         gbraid        = COALESCE(NULLIF(_attribution->>'gbraid',''),        gbraid),
         wbraid        = COALESCE(NULLIF(_attribution->>'wbraid',''),        wbraid),
         utm_source    = COALESCE(NULLIF(_attribution->>'utm_source',''),    utm_source),
         utm_medium    = COALESCE(NULLIF(_attribution->>'utm_medium',''),    utm_medium),
         utm_campaign  = COALESCE(NULLIF(_attribution->>'utm_campaign',''),  utm_campaign),
         utm_term      = COALESCE(NULLIF(_attribution->>'utm_term',''),      utm_term),
         utm_content   = COALESCE(NULLIF(_attribution->>'utm_content',''),   utm_content),
         landing_page  = COALESCE(NULLIF(_attribution->>'landing_page',''),  landing_page),
         user_agent    = COALESCE(NULLIF(_attribution->>'user_agent',''),    user_agent),
         updated_at    = now()
   WHERE confirmation_token = _token;
END;
$$;
