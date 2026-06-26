
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS estimate_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS invoice_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inspection_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS repair_order_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS membership_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_updates boolean NOT NULL DEFAULT false;
