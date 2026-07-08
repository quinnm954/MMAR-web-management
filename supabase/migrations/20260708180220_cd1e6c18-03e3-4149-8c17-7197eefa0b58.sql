-- Restrict admin role assignment: managers cannot grant admin
CREATE POLICY "Only admins grant admin role"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (role <> 'admin'::app_role OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));

-- Restrict admin role revocation: managers cannot revoke admin either
CREATE POLICY "Only admins revoke admin role"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (role <> 'admin'::app_role OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'owner'::app_role));