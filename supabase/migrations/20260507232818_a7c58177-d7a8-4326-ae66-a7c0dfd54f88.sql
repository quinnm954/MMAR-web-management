CREATE TABLE IF NOT EXISTS public.service_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  reminder_type text NOT NULL,
  reference_id uuid NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reminder_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_reminders_customer ON public.service_reminders_sent (customer_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON public.service_reminders_sent (sent_at DESC);

ALTER TABLE public.service_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reminders sent" ON public.service_reminders_sent
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages reminders" ON public.service_reminders_sent
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');