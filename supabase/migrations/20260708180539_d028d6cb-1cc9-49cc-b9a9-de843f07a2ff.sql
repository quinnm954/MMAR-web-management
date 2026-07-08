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
  IF v_email <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE lower(email) = v_email LIMIT 1;
  END IF;
  IF v_customer_id IS NULL AND v_phone <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE phone = v_phone LIMIT 1;
  END IF;

  staff_body := COALESCE(v_name, 'A customer')
    || ' requested ' || v_service
    || CASE WHEN v_vehicle IS NOT NULL THEN ' on ' || v_vehicle ELSE '' END
    || CASE WHEN v_phone <> '' THEN ' (' || v_phone || ')' ELSE '' END;

  -- Staff/admin notification — always fire for every staff member,
  -- regardless of whether they happen to match the booking's contact info.
  FOR r IN
    SELECT DISTINCT user_id FROM public.user_roles
    WHERE role IN ('owner','admin','manager','service_advisor')
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

  -- Customer notification (only if the requester has a customer profile)
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