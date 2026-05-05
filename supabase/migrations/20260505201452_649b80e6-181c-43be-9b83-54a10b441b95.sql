CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_comments_slug ON public.blog_comments(post_slug, created_at DESC);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Public can read approved comments; admins see all
CREATE POLICY "Public can view approved comments"
ON public.blog_comments FOR SELECT
USING (is_approved = true OR has_role(auth.uid(), 'admin'::app_role));

-- Anyone (anon) can post a comment
CREATE POLICY "Anyone can post comments"
ON public.blog_comments FOR INSERT
WITH CHECK (
  length(trim(author_name)) BETWEEN 1 AND 80
  AND length(trim(author_email)) BETWEEN 3 AND 200
  AND author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(trim(content)) BETWEEN 1 AND 2000
  AND length(trim(post_slug)) BETWEEN 1 AND 200
);

-- Admins can moderate
CREATE POLICY "Admins can update comments"
ON public.blog_comments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete comments"
ON public.blog_comments FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));