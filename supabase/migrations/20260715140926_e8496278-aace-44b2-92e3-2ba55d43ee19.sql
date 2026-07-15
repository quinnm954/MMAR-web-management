
-- Generic helper: notify staff of a customer action
CREATE OR REPLACE FUNCTION public._notify_staff_customer_action(_title text, _body text, _link text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when an authenticated non-staff user did the action
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN
    RETURN;
  END IF;
  PERFORM public._send_push_to_staff(_title, COALESCE(_body,''), 'message_updates', _link);
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- vehicle_mileage_logs: customer submits new mileage
CREATE OR REPLACE FUNCTION public.notify_staff_on_mileage_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_veh text;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = NEW.customer_id;
  SELECT NULLIF(trim(COALESCE(year::text,'')||' '||COALESCE(make,'')||' '||COALESCE(model,'')), '')
    INTO v_veh FROM public.vehicles WHERE id = NEW.vehicle_id;
  PERFORM public._send_push_to_staff(
    'Mileage updated',
    COALESCE(v_name,'A customer')||' logged '||NEW.mileage::text||' mi'||CASE WHEN v_veh IS NOT NULL THEN ' on '||v_veh ELSE '' END,
    'message_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_mileage_log ON public.vehicle_mileage_logs;
CREATE TRIGGER trg_notify_staff_mileage_log
AFTER INSERT ON public.vehicle_mileage_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_mileage_log();

-- vehicles: customer added or edited a vehicle
CREATE OR REPLACE FUNCTION public.notify_staff_on_vehicle_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_veh text; v_action text;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = NEW.customer_id;
  v_veh := NULLIF(trim(COALESCE(NEW.year::text,'')||' '||COALESCE(NEW.make,'')||' '||COALESCE(NEW.model,'')), '');
  v_action := CASE TG_OP WHEN 'INSERT' THEN 'added a vehicle' ELSE 'updated a vehicle' END;
  PERFORM public._send_push_to_staff(
    'Customer '||v_action,
    COALESCE(v_name,'A customer')||CASE WHEN v_veh IS NOT NULL THEN ' — '||v_veh ELSE '' END,
    'message_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_vehicle_change ON public.vehicles;
CREATE TRIGGER trg_notify_staff_vehicle_change
AFTER INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_vehicle_change();

-- profiles: customer edited their profile
CREATE OR REPLACE FUNCTION public.notify_staff_on_profile_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
  PERFORM public._send_push_to_staff(
    'Customer profile updated',
    COALESCE(NEW.full_name, NEW.email, 'A customer')||' updated their profile.',
    'message_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_profile_change ON public.profiles;
CREATE TRIGGER trg_notify_staff_profile_change
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_profile_change();

-- estimates: customer approved/declined line items (line_items changed by non-staff)
CREATE OR REPLACE FUNCTION public.notify_staff_on_estimate_customer_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.line_items IS NOT DISTINCT FROM OLD.line_items THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = NEW.customer_id;
  PERFORM public._send_push_to_staff(
    'Estimate reviewed by customer',
    COALESCE(v_name,'A customer')||' updated line items on estimate '||COALESCE(NEW.estimate_number,''),
    'estimate_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_estimate_customer_edit ON public.estimates;
CREATE TRIGGER trg_notify_staff_estimate_customer_edit
AFTER UPDATE ON public.estimates
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_estimate_customer_edit();

-- memberships: customer signed up
CREATE OR REPLACE FUNCTION public.notify_staff_on_membership_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = NEW.customer_id;
  PERFORM public._send_push_to_staff(
    'New membership signup',
    COALESCE(v_name,'A customer')||' started a membership.',
    'membership_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_membership_signup ON public.memberships;
CREATE TRIGGER trg_notify_staff_membership_signup
AFTER INSERT ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_membership_signup();

-- warranty_acknowledgments: customer acknowledged warranty
CREATE OR REPLACE FUNCTION public.notify_staff_on_warranty_ack()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, email) INTO v_name FROM public.profiles WHERE id = NEW.customer_id;
  PERFORM public._send_push_to_staff(
    'Warranty acknowledged',
    COALESCE(v_name,'A customer')||' acknowledged a warranty.',
    'message_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_warranty_ack ON public.warranty_acknowledgments;
CREATE TRIGGER trg_notify_staff_warranty_ack
AFTER INSERT ON public.warranty_acknowledgments
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_warranty_ack();

-- service_checklist_items: customer edited a checklist
CREATE OR REPLACE FUNCTION public.notify_staff_on_checklist_customer_edit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW IS NOT DISTINCT FROM OLD THEN RETURN NEW; END IF;
  PERFORM public._send_push_to_staff(
    'Checklist updated by customer',
    'A customer updated a checklist item: '||COALESCE(NEW.label,''),
    'message_updates',
    '/admin/dashboard'
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_staff_checklist_customer_edit ON public.service_checklist_items;
CREATE TRIGGER trg_notify_staff_checklist_customer_edit
AFTER UPDATE ON public.service_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_checklist_customer_edit();
