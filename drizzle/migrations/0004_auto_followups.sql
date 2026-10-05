ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS followup_last_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS auto_sent_at timestamptz, ADD COLUMN IF NOT EXISTS reminder_count integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS reminder_last_at timestamptz, ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;
-- Existing records predate the automation: don't blast old customers.
UPDATE public.estimates SET followup_count = 2 WHERE sent_at IS NULL OR sent_at < now() - interval '3 days';
UPDATE public.invoices SET auto_sent_at = created_at, reminder_count = 2, review_requested_at = COALESCE(paid_at, created_at);
CREATE TABLE IF NOT EXISTS public.followup_worker_state (id int PRIMARY KEY DEFAULT 1, lease_until timestamptz, last_run_at timestamptz, CHECK (id = 1));
GRANT ALL ON public.followup_worker_state TO service_role;
ALTER TABLE public.followup_worker_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.followup_worker_state(id) VALUES (1) ON CONFLICT DO NOTHING;