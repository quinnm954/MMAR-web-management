ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS stripe_fee numeric,
  ADD COLUMN IF NOT EXISTS stripe_fee_synced_at timestamptz;