-- Restrict owner role grants to owners only (defense in depth alongside the UI guard).
-- Existing admin-level policies on user_roles are preserved.
CREATE POLICY "Only owners grant owner role"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (role <> 'owner' OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Only owners revoke owner role"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (role <> 'owner' OR public.has_role(auth.uid(), 'owner'));