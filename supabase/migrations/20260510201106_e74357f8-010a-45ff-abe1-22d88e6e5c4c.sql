
CREATE OR REPLACE FUNCTION public.restrict_owner_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_email text;
  v_actor uuid := auth.uid();
BEGIN
  IF NEW.role <> 'owner' THEN
    RETURN NEW;
  END IF;

  SELECT lower(email) INTO v_target_email FROM auth.users WHERE id = NEW.user_id;

  -- Bootstrap: original owner account always allowed
  IF v_target_email = 'quinnm954@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- Otherwise, only an existing owner (acting in-app) can grant owner
  IF v_actor IS NULL OR NOT public.has_role(v_actor, 'owner') THEN
    RAISE EXCEPTION 'Only an existing owner can grant the owner role';
  END IF;

  RETURN NEW;
END;
$$;
