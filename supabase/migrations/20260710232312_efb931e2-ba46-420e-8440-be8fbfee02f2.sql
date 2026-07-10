ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pwa_tutorial_seen_at timestamptz;