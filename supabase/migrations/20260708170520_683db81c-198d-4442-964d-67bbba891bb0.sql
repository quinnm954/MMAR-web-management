
-- Column-level restriction: revoke broad SELECT and re-grant only safe columns.
REVOKE SELECT ON public.blog_comments FROM anon;
REVOKE SELECT ON public.blog_comments FROM authenticated;

GRANT SELECT (id, post_slug, author_name, content, is_approved, created_at)
  ON public.blog_comments TO anon;
GRANT SELECT (id, post_slug, author_name, content, is_approved, created_at)
  ON public.blog_comments TO authenticated;

-- Admins keep full-column access via their own SELECT policy; keep service_role broad.
GRANT ALL ON public.blog_comments TO service_role;
