-- Restore staff notifications for booking requests; keep customer notification distinct
CREATE OR REPLACE FUNCTION public.notify_staff_on_booking_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r RECORD;
  v_customer_id uuid;
  v_email text := lower(trim(COALESCE(NEW.customer_email, '')));
  v_phone text := trim(COALESCE(NEW.customer_phone, ''));
  v_service text := COALESCE(NULLIF(trim(NEW.service_type), ''), 'service');
  v_vehicle text := NULLIF(trim(COALESCE(NEW.vehicle_info, '')), '');
  v_name text := NULLIF(trim(COALESCE(NEW.customer_name, '')), '');
  staff_body text;
  customer_body text;
BEGIN
  -- Resolve the customer profile (by email, then phone)
  IF v_email <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE lower(email) = v_email LIMIT 1;
  END IF;
  IF v_customer_id IS NULL AND v_phone <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE phone = v_phone LIMIT 1;
  END IF;

  -- Staff/admin notification: who requested what, on which vehicle, plus phone
  staff_body := COALESCE(v_name, 'A customer')
    || ' requested ' || v_service
    || CASE WHEN v_vehicle IS NOT NULL THEN ' on ' || v_vehicle ELSE '' END
    || CASE WHEN v_phone <> '' THEN ' (' || v_phone || ')' ELSE '' END;

  FOR r IN
    SELECT DISTINCT user_id FROM public.user_roles
    WHERE role IN ('owner','admin','manager','service_advisor')
      AND (v_customer_id IS NULL OR user_id <> v_customer_id)
  LOOP
    PERFORM public.create_notification(
      r.user_id,
      'New booking request',
      staff_body,
      'appointment_reminders',
      '/admin?tab=booking-requests',
      jsonb_build_object('booking_request_id', NEW.id)
    );
  END LOOP;

  -- Customer notification with service + vehicle specifics
  IF v_customer_id IS NOT NULL THEN
    customer_body := 'We got your request for ' || v_service
      || CASE WHEN v_vehicle IS NOT NULL THEN ' on your ' || v_vehicle ELSE '' END
      || '. We''ll text you shortly to confirm.';

    PERFORM public.create_notification(
      v_customer_id,
      'Booking request received',
      customer_body,
      'appointment_reminders',
      '/portal/appointments',
      jsonb_build_object('booking_request_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Job-assigned: make the technician notification appear in the in-app center too,
-- with the specific service and vehicle. Customer status notifications unchanged.
CREATE OR REPLACE FUNCTION public.notify_appointment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vehicle text;
  v_service text;
  v_job_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public._send_push_to_staff('New appointment', COALESCE(NEW.service_type,'Service'), 'appointment_reminders', '/admin/dashboard');
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM public._send_push(NEW.customer_id, 'Appointment confirmed', COALESCE(NEW.service_type,'Your appointment')||' is confirmed.', 'appointment_reminders', '/portal/appointments');
    ELSIF NEW.status = 'in_progress' THEN
      PERFORM public._send_push(NEW.customer_id, 'Service started', 'Your tech is working on your vehicle.', 'appointment_reminders', '/portal/appointments');
    ELSIF NEW.status = 'completed' THEN
      PERFORM public._send_push(NEW.customer_id, 'Service complete', 'Your service is done. Tap for details.', 'appointment_reminders', '/portal/service-history');
    END IF;
  END IF;

  -- Notify assigned tech when they get (re)assigned or the job becomes active
  IF NEW.assigned_technician_id IS NOT NULL
     AND COALESCE(NEW.status, '') IN ('scheduled','confirmed','in_progress')
     AND (
       COALESCE(OLD.assigned_technician_id::text,'') IS DISTINCT FROM COALESCE(NEW.assigned_technician_id::text,'')
       OR COALESCE(OLD.status,'') IS DISTINCT FROM COALESCE(NEW.status,'')
     ) THEN
    v_service := COALESCE(NULLIF(trim(NEW.service_type),''), 'New job');
    SELECT NULLIF(trim(COALESCE(v.year::text,'') || ' ' || COALESCE(v.make,'') || ' ' || COALESCE(v.model,'')), '')
      INTO v_vehicle
      FROM public.vehicles v WHERE v.id = NEW.vehicle_id;

    v_job_body := v_service
      || CASE WHEN v_vehicle IS NOT NULL THEN ' — ' || v_vehicle ELSE '' END;

    PERFORM public.create_notification(
      NEW.assigned_technician_id,
      'Job assigned',
      v_job_body,
      'appointment_reminders',
      '/tech/jobs',
      jsonb_build_object('appointment_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$function$;