CREATE TABLE public.enrollment_tokens (
  token text PRIMARY KEY DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.enrollment_tokens TO service_role;
ALTER TABLE public.enrollment_tokens ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.enrollment_tokens IS 'Per-customer link token for phone-only customers to finish account setup; service role only.';