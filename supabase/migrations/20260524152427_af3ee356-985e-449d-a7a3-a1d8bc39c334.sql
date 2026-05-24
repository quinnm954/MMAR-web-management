
-- 1. customer_shares: drop public token policy (frontend uses get_shared_customer_summary RPC)
DROP POLICY IF EXISTS "Public can read valid share by token" ON public.customer_shares;

-- 2. tracking_settings: drop public read, expose only safe fields via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can read tracking settings" ON public.tracking_settings;

CREATE OR REPLACE FUNCTION public.get_public_tracking_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'google_ads_conversion_id', google_ads_conversion_id,
    'phone_call_label', phone_call_label,
    'text_click_label', text_click_label,
    'quote_submit_label', quote_submit_label,
    'lead_label', lead_label,
    'wcc_phone_number', wcc_phone_number,
    'wcc_conversion_id', wcc_conversion_id,
    'dni_enabled', dni_enabled
  )
  FROM public.tracking_settings
  WHERE id = 1
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_tracking_settings() TO anon, authenticated;

-- 3. Set search_path on email-queue functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;

-- 4. inspection-photos: drop overly broad SELECT (public URL access still works for public buckets)
DROP POLICY IF EXISTS "Inspection photos are public" ON storage.objects;
-- Allow staff to list/select for admin UIs
CREATE POLICY "Staff read inspection photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-photos' AND public.is_staff(auth.uid()));

-- 5. SMS realtime: restrict realtime.messages subscriptions to admins only
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins only can receive realtime" ON realtime.messages;
CREATE POLICY "Admins only can receive realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
