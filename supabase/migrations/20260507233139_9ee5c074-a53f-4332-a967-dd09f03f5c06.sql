ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS signature_image text,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz;