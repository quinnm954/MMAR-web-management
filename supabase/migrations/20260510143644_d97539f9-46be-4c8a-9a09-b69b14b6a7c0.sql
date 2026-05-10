
-- Tracking settings (single-row pattern)
CREATE TABLE IF NOT EXISTS public.tracking_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  google_ads_conversion_id TEXT,                -- e.g. AW-17463969717
  phone_call_label TEXT,                        -- gtag send_to label for click-to-call
  text_click_label TEXT,                        -- gtag send_to label for click-to-text
  quote_submit_label TEXT,                      -- gtag send_to label for quote form submit
  lead_label TEXT,                              -- gtag send_to label for any lead (booking)
  wcc_phone_number TEXT,                        -- displayed (real) phone number for DNI
  wcc_conversion_id TEXT,                       -- WCC phone_conversion_id (e.g. AW-XXX/YYY)
  dni_enabled BOOLEAN NOT NULL DEFAULT false,   -- enable Website Call Conversions / number swap
  enhanced_conversions BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.tracking_settings (id, google_ads_conversion_id, phone_call_label)
VALUES (1, 'AW-17463969717', 'WpXhCN-p-t0bELWPvIdB')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tracking settings"
  ON public.tracking_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage tracking settings"
  ON public.tracking_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_tracking_settings_updated
  BEFORE UPDATE ON public.tracking_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attribution columns on booking_requests
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS landing_page TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Same on call_logs (table exists from prior migration)
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS gbraid TEXT,
  ADD COLUMN IF NOT EXISTS wbraid TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS conversion_uploaded_at TIMESTAMPTZ;
