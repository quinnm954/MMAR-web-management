CREATE TABLE public.customer_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_by uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_shares_token ON public.customer_shares(token);

ALTER TABLE public.customer_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage customer shares"
  ON public.customer_shares FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read valid share by token"
  ON public.customer_shares FOR SELECT
  USING (revoked_at IS NULL AND expires_at > now());

-- Public-readable view-like access for the linked records via security definer function
CREATE OR REPLACE FUNCTION public.get_shared_customer_summary(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_share FROM public.customer_shares
   WHERE token = _token AND revoked_at IS NULL AND expires_at > now()
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'customer', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = v_share.customer_id),
    'vehicles', COALESCE((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.created_at DESC)
                          FROM public.vehicles v WHERE v.owner_id = v_share.customer_id), '[]'::jsonb),
    'service_records', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.service_date DESC)
                          FROM (SELECT * FROM public.service_records
                                WHERE customer_id = v_share.customer_id
                                ORDER BY service_date DESC LIMIT 10) s), '[]'::jsonb),
    'expires_at', v_share.expires_at
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_customer_summary(text) TO anon, authenticated;