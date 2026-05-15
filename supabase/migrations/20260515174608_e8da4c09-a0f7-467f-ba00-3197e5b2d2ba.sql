CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  model text,
  cost_usd numeric NOT NULL DEFAULT 0,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at ON public.ai_usage_log (created_at DESC);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view ai usage" ON public.ai_usage_log;
CREATE POLICY "Admins view ai usage" ON public.ai_usage_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role inserts ai usage" ON public.ai_usage_log;
CREATE POLICY "Service role inserts ai usage" ON public.ai_usage_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS ai_budget_usd numeric NOT NULL DEFAULT 10;