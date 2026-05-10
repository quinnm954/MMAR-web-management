
-- Prevent owner accounts from ever holding the 'customer' role.
-- 1) Trigger on user_roles: block conflicting inserts/updates.
CREATE OR REPLACE FUNCTION public.prevent_owner_customer_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block adding 'customer' to a user who is an owner
  IF NEW.role = 'customer' AND public.has_role(NEW.user_id, 'owner') THEN
    RAISE EXCEPTION 'Owner accounts cannot also be customers';
  END IF;

  -- When 'owner' is granted, automatically strip any 'customer' role
  IF NEW.role = 'owner' THEN
    DELETE FROM public.user_roles
     WHERE user_id = NEW.user_id AND role = 'customer';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_owner_customer_conflict_trg ON public.user_roles;
CREATE TRIGGER prevent_owner_customer_conflict_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_owner_customer_conflict();

-- 2) Update handle_new_user so designated owner emails get 'owner' instead of 'customer'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner_email boolean := lower(NEW.email) = 'quinnm954@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  IF v_is_owner_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Clean up: if the owner email already exists with a customer role, fix it now.
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'quinnm954@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
    DELETE FROM public.user_roles WHERE user_id = v_uid AND role = 'customer';
  END IF;
END$$;
