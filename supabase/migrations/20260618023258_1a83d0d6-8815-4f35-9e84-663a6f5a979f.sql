
-- Drop the public-read policy that exposed author_email
DROP POLICY IF EXISTS "Public can view approved comments" ON public.blog_comments;

-- Create a safe view that omits author_email
CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker = false) AS
SELECT id, post_slug, author_name, content, created_at, is_approved
FROM public.blog_comments
WHERE is_approved = true;

GRANT SELECT ON public.blog_comments_public TO anon, authenticated;

-- Ensure admins can still read everything (policy already exists, but make sure)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='blog_comments' AND policyname='Admins can read all blog comments'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can read all blog comments" ON public.blog_comments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;
