
CREATE OR REPLACE FUNCTION public.notify_staff_on_booking_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  title text;
  body text;
BEGIN
  title := 'New booking request';
  body := COALESCE(NEW.customer_name, 'A customer')
          || ' requested '
          || COALESCE(NEW.service_type, 'service')
          || CASE WHEN NEW.customer_phone IS NOT NULL AND NEW.customer_phone <> ''
                  THEN ' (' || NEW.customer_phone || ')' ELSE '' END;

  FOR r IN
    SELECT DISTINCT user_id
    FROM public.user_roles
    WHERE role IN ('owner','admin','manager','service_advisor')
  LOOP
    PERFORM public.create_notification(
      r.user_id,
      title,
      body,
      'appointment_reminders',
      '/admin?tab=booking-requests',
      jsonb_build_object('booking_request_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_staff_on_booking_request ON public.booking_requests;
CREATE TRIGGER trg_notify_staff_on_booking_request
AFTER INSERT ON public.booking_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_on_booking_request();
