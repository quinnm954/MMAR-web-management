CREATE OR REPLACE FUNCTION public.notify_staff_on_booking_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_id uuid;
  v_email text := lower(trim(COALESCE(NEW.customer_email, '')));
  v_phone text := trim(COALESCE(NEW.customer_phone, ''));
  v_service text := COALESCE(NULLIF(trim(NEW.service_type), ''), 'service');
  v_vehicle text := NULLIF(trim(COALESCE(NEW.vehicle_info, '')), '');
  v_body text;
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

  -- Customer-only notification with service + vehicle specifics
  IF v_customer_id IS NOT NULL THEN
    v_body := 'We got your request for ' || v_service
      || CASE WHEN v_vehicle IS NOT NULL THEN ' on your ' || v_vehicle ELSE '' END
      || '. We''ll text you shortly to confirm.';

    PERFORM public.create_notification(
      v_customer_id,
      'Booking request received',
      v_body,
      'appointment_reminders',
      '/portal/appointments',
      jsonb_build_object('booking_request_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$function$;