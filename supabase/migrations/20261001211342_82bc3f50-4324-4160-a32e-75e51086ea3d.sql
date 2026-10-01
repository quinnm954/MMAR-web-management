CREATE OR REPLACE FUNCTION public._send_tech_job_assigned_email(_appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/notify-tech-job-assigned';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc';
BEGIN
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey', v_key),
    body := jsonb_build_object('appointmentId', _appointment_id)
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public._send_tech_job_assigned_email(uuid) FROM public, anon, authenticated;