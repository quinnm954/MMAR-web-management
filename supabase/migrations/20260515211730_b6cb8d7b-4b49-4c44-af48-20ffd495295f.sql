CREATE OR REPLACE FUNCTION public.admin_confirm_booking_request(
  _id uuid,
  _requested_date date DEFAULT NULL,
  _requested_time_window text DEFAULT NULL,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_req public.booking_requests;
  v_customer_id uuid;
  v_appointment_id uuid;
  v_email text;
  v_phone text;
  v_final_date date;
  v_final_window text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_req FROM public.booking_requests WHERE id = _id LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found';
  END IF;

  v_final_date := COALESCE(_requested_date, v_req.requested_date);
  v_final_window := COALESCE(NULLIF(trim(COALESCE(_requested_time_window,'')), ''), v_req.requested_time_window);

  -- Update the booking request fields first
  UPDATE public.booking_requests
     SET requested_date = v_final_date,
         requested_time_window = v_final_window,
         notes = COALESCE(NULLIF(trim(COALESCE(_notes,'')), ''), notes),
         updated_at = now()
   WHERE id = _id;

  -- If already converted to an appointment, just keep status and return
  IF v_req.converted_appointment_id IS NOT NULL THEN
    UPDATE public.appointments
       SET requested_date = v_final_date,
           requested_time_window = v_final_window,
           status = CASE WHEN status IN ('cancelled','completed') THEN status ELSE 'confirmed' END,
           updated_at = now()
     WHERE id = v_req.converted_appointment_id;

    UPDATE public.booking_requests
       SET status = 'converted', updated_at = now()
     WHERE id = _id;

    RETURN jsonb_build_object(
      'id', _id,
      'status', 'converted',
      'appointment_id', v_req.converted_appointment_id,
      'reused', true
    );
  END IF;

  v_email := lower(trim(COALESCE(v_req.customer_email, '')));
  v_phone := trim(COALESCE(v_req.customer_phone, ''));

  -- Resolve the customer (profile) for this booking
  IF v_email <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE lower(email) = v_email LIMIT 1;
  END IF;

  IF v_customer_id IS NULL AND v_phone <> '' THEN
    SELECT id INTO v_customer_id FROM public.profiles
     WHERE phone = v_phone LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    v_customer_id := gen_random_uuid();
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (
      v_customer_id,
      NULLIF(v_email, ''),
      NULLIF(trim(COALESCE(v_req.customer_name, '')), ''),
      NULLIF(v_phone, '')
    );
  END IF;

  -- Create the appointment
  INSERT INTO public.appointments (
    customer_id,
    service_type,
    description,
    requested_date,
    requested_time_window,
    service_address,
    status,
    source,
    technician_notes,
    board_column
  ) VALUES (
    v_customer_id,
    COALESCE(v_req.service_type, 'Service request'),
    v_req.description,
    v_final_date,
    v_final_window,
    v_req.service_address,
    'confirmed',
    COALESCE(v_req.source, 'website_booking'),
    v_req.notes,
    'scheduled'
  )
  RETURNING id INTO v_appointment_id;

  -- Mark the booking request as converted and link it
  UPDATE public.booking_requests
     SET status = 'converted',
         converted_appointment_id = v_appointment_id,
         updated_at = now()
   WHERE id = _id;

  RETURN jsonb_build_object(
    'id', _id,
    'status', 'converted',
    'appointment_id', v_appointment_id,
    'customer_id', v_customer_id,
    'reused', false
  );
END;
$function$;