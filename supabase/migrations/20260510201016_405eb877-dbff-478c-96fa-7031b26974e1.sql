
-- Cleanup: remove owner role from anyone who isn't the designated owner email
DELETE FROM public.user_roles
 WHERE role = 'owner'
   AND user_id NOT IN (SELECT id FROM auth.users WHERE lower(email) = 'quinnm954@gmail.com');

CREATE OR REPLACE FUNCTION public.restrict_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.role = 'owner' THEN
    SELECT lower(email) INTO v_email FROM auth.users WHERE id = NEW.user_id;
    IF v_email IS DISTINCT FROM 'quinnm954@gmail.com' THEN
      RAISE EXCEPTION 'Owner role is reserved and cannot be granted to this account';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_owner_role ON public.user_roles;
CREATE TRIGGER trg_restrict_owner_role
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.restrict_owner_role();
