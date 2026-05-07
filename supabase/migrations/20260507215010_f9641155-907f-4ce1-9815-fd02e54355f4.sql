ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_session ON public.invoices(stripe_session_id);