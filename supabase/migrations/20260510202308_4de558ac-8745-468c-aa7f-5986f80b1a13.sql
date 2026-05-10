CREATE OR REPLACE FUNCTION public.restrict_owner_email_to_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = NEW.user_id;
  IF v_email = 'quinnm954@gmail.com' AND NEW.role <> 'owner' THEN
    RAISE EXCEPTION 'Owner account quinnm954@gmail.com can only hold the owner role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_owner_email_to_owner_role ON public.user_roles;
CREATE TRIGGER trg_restrict_owner_email_to_owner_role
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.restrict_owner_email_to_owner_role();

-- Cleanup safety: remove any non-owner roles currently attached (none expected)
DELETE FROM public.user_roles
 WHERE role <> 'owner'
   AND user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'quinnm954@gmail.com');