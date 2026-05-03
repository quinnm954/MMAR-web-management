-- Cache table for Facebook (and any future) feed responses
CREATE TABLE public.social_cache (
  source text PRIMARY KEY,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_cache ENABLE ROW LEVEL SECURITY;

-- Public read so the frontend can read cached payloads through the edge function (and directly if needed)
CREATE POLICY "Public can read social cache"
  ON public.social_cache
  FOR SELECT
  USING (true);

-- No insert/update/delete policies => only service role (edge functions) can write

-- Admin-curated TikTok videos
CREATE TABLE public.tiktok_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  caption text,
  posted_at timestamptz NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tiktok_videos_sort ON public.tiktok_videos (is_published, sort_order DESC, posted_at DESC);

ALTER TABLE public.tiktok_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published tiktok videos"
  ON public.tiktok_videos
  FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert tiktok videos"
  ON public.tiktok_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tiktok videos"
  ON public.tiktok_videos
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tiktok videos"
  ON public.tiktok_videos
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tiktok_videos_updated_at
  BEFORE UPDATE ON public.tiktok_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();