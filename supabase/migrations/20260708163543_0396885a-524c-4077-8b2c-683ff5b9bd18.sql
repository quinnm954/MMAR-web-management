
CREATE OR REPLACE FUNCTION public.notify_staff_on_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_customer_id uuid;
  v_email text := lower(trim(COALESCE(NEW.customer_email, '')));
  v_phone text := trim(COALESCE(NEW.customer_phone, ''));
  staff_title text := 'New booking request';
  staff_body text;
BEGIN
  staff_body := COALESCE(NEW.customer_name, 'A customer')
    || ' requested ' || COALESCE(NEW.service_type, 'service')
    || CASE WHEN v_phone <> '' THEN ' (' || v_phone || ')' ELSE '' END;

  -- Staff notifications
  FOR r IN
    SELECT DISTINCT user_id FROM public.user_roles
    WHERE role IN ('owner','admin','manager','service_advisor')
  LOOP
    PERFORM public.create_notification(
      r.user_id, staff_title, staff_body,
      'appointment_reminders',
      '/admin?tab=booking-requests',
      jsonb_build_object('booking_request_id', NEW.id)
    );
  END LOOP;

  -- Customer notification (if we can link to an existing profile)
  IF v_email <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE lower(email) = v_email LIMIT 1;
  END IF;
  IF v_customer_id IS NULL AND v_phone <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE phone = v_phone LIMIT 1;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    PERFORM public.create_notification(
      v_customer_id,
      'Booking request received',
      'We got your request for ' || COALESCE(NEW.service_type, 'service')
        || '. We''ll text you shortly to confirm.',
      'appointment_reminders',
      '/portal/appointments',
      jsonb_build_object('booking_request_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;
