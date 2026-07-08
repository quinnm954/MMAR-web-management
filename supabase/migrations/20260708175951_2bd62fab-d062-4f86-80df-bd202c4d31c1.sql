-- Helper that emails the assigned technician a job-assigned notification
CREATE OR REPLACE FUNCTION public._send_tech_job_assigned_email(_appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/send-transactional-email';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc';
  v_appt RECORD;
  v_tech RECORD;
  v_cust RECORD;
  v_vehicle text;
  v_scheduled text;
BEGIN
  SELECT a.id, a.service_type, a.description, a.service_address, a.scheduled_at,
         a.customer_id, a.vehicle_id, a.assigned_technician_id
    INTO v_appt
    FROM public.appointments a WHERE a.id = _appointment_id;
  IF NOT FOUND OR v_appt.assigned_technician_id IS NULL THEN RETURN; END IF;

  SELECT p.id, p.email, p.full_name INTO v_tech
    FROM public.profiles p WHERE p.id = v_appt.assigned_technician_id;
  IF v_tech.email IS NULL OR trim(v_tech.email) = '' THEN RETURN; END IF;

  SELECT p.full_name, p.phone INTO v_cust
    FROM public.profiles p WHERE p.id = v_appt.customer_id;

  SELECT NULLIF(trim(COALESCE(v.year::text,'') || ' ' || COALESCE(v.make,'') || ' ' || COALESCE(v.model,'')), '')
    INTO v_vehicle
    FROM public.vehicles v WHERE v.id = v_appt.vehicle_id;

  v_scheduled := CASE
    WHEN v_appt.scheduled_at IS NOT NULL
    THEN to_char(v_appt.scheduled_at AT TIME ZONE 'America/New_York', 'Mon DD, YYYY · HH12:MI AM')
    ELSE NULL
  END;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer '||v_key,
      'apikey', v_key
    ),
    body := jsonb_build_object(
      'templateName', 'tech-job-assigned',
      'recipientEmail', v_tech.email,
      'idempotencyKey', 'tech-job-assigned-' || v_appt.id::text || '-' || v_appt.assigned_technician_id::text,
      'templateData', jsonb_build_object(
        'technicianName', v_tech.full_name,
        'customerName', v_cust.full_name,
        'customerPhone', v_cust.phone,
        'serviceType', v_appt.service_type,
        'vehicle', v_vehicle,
        'scheduledAt', v_scheduled,
        'serviceAddress', v_appt.service_address,
        'description', v_appt.description,
        'jobsUrl', 'https://shop-flow-home.lovable.app/tech/jobs'
      )
    )
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- never break the originating transaction
END;
$$;

REVOKE EXECUTE ON FUNCTION public._send_tech_job_assigned_email(uuid) FROM public, anon, authenticated;

-- Wire the email into the existing appointment-status trigger
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
    IF NEW.assigned_technician_id IS NOT NULL THEN
      PERFORM public._send_tech_job_assigned_email(NEW.id);
    END IF;
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

  IF NEW.assigned_technician_id IS NOT NULL
     AND COALESCE(NEW.status,'') IN ('scheduled','confirmed','in_progress')
     AND (
       COALESCE(OLD.assigned_technician_id::text,'') IS DISTINCT FROM COALESCE(NEW.assigned_technician_id::text,'')
       OR COALESCE(OLD.status,'') IS DISTINCT FROM COALESCE(NEW.status,'')
     ) THEN
    v_service := COALESCE(NULLIF(trim(NEW.service_type),''), 'New job');
    SELECT NULLIF(trim(COALESCE(v.year::text,'') || ' ' || COALESCE(v.make,'') || ' ' || COALESCE(v.model,'')), '')
      INTO v_vehicle
      FROM public.vehicles v WHERE v.id = NEW.vehicle_id;
    v_job_body := v_service || CASE WHEN v_vehicle IS NOT NULL THEN ' — ' || v_vehicle ELSE '' END;

    PERFORM public.create_notification(
      NEW.assigned_technician_id,
      'Job assigned',
      v_job_body,
      'appointment_reminders',
      '/tech/jobs',
      jsonb_build_object('appointment_id', NEW.id)
    );

    -- Send tech email only when the assignee actually changed
    IF COALESCE(OLD.assigned_technician_id::text,'') IS DISTINCT FROM COALESCE(NEW.assigned_technician_id::text,'') THEN
      PERFORM public._send_tech_job_assigned_email(NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;