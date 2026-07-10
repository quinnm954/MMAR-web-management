-- 1) Drop stale 5-arg overload of submit_estimate_decision so PostgREST can resolve the RPC unambiguously
DROP FUNCTION IF EXISTS public.submit_estimate_decision(text, jsonb, text, text, text);

-- 2) Security fix: hide author_email from public SELECT on blog_comments
DROP POLICY IF EXISTS "Public can view approved comments" ON public.blog_comments;

CREATE POLICY "Admins can view all comments"
  ON public.blog_comments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker = on) AS
  SELECT id, post_slug, author_name, content, created_at, is_approved
    FROM public.blog_comments
   WHERE is_approved = true;

GRANT SELECT ON public.blog_comments_public TO anon, authenticated;