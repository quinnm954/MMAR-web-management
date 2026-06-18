
DROP VIEW IF EXISTS public.blog_comments_public;

DROP POLICY IF EXISTS "Public can view approved comments" ON public.blog_comments;
CREATE POLICY "Public can view approved comments"
ON public.blog_comments FOR SELECT
TO anon, authenticated
USING (is_approved = true);

REVOKE SELECT (author_email) ON public.blog_comments FROM anon, authenticated;
GRANT SELECT (id, post_slug, author_name, content, is_approved, created_at)
  ON public.blog_comments TO anon, authenticated;
