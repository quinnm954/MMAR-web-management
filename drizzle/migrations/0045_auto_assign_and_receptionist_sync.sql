ALTER TABLE public.phone_settings ADD COLUMN IF NOT EXISTS ai_synced_at timestamptz, ADD COLUMN IF NOT EXISTS ai_sync_error text, ADD COLUMN IF NOT EXISTS ai_sync_requested_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS needs_tech_choice boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.request_receptionist_sync() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'phone_settings' AND TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - ARRAY['ai_synced_at','ai_sync_error','ai_sync_requested_at','ai_agent_id','updated_at'])
       = (to_jsonb(OLD) - ARRAY['ai_synced_at','ai_sync_error','ai_sync_requested_at','ai_agent_id','updated_at']) THEN
      RETURN NEW;
    END IF;
    NEW.ai_sync_requested_at := now();
  ELSE
    UPDATE public.phone_settings SET ai_sync_requested_at = now() WHERE id = 1;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := 'https://owgpxujfytskdfmrhjgk.supabase.co/functions/v1/ai-receptionist?action=setup&auto=1',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Z3B4dWpmeXRza2RmbXJoamdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ5NDMsImV4cCI6MjA4MTM5MDk0M30.6zEygmSkP74HP3J8jrzIUmnZ82pMQc0FgbG6qeo_bFc'),
      body := '{}'::jsonb, timeout_milliseconds := 30000);
  EXCEPTION WHEN others THEN NULL;
  END;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER phone_settings_request_sync BEFORE UPDATE ON public.phone_settings FOR EACH ROW EXECUTE FUNCTION public.request_receptionist_sync();
CREATE TRIGGER service_regions_request_sync AFTER INSERT OR UPDATE OR DELETE ON public.service_regions FOR EACH STATEMENT EXECUTE FUNCTION public.request_receptionist_sync();
CREATE TRIGGER user_service_regions_request_sync AFTER INSERT OR UPDATE OR DELETE ON public.user_service_regions FOR EACH STATEMENT EXECUTE FUNCTION public.request_receptionist_sync();

CREATE OR REPLACE FUNCTION public.auto_assign_region_tech() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int; t uuid;
BEGIN
  IF NEW.assigned_technician_id IS NOT NULL THEN NEW.needs_tech_choice := false; RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
  SELECT count(*), min(user_id::text)::uuid INTO n, t FROM public.user_service_regions WHERE region_slug = COALESCE(NEW.region_slug, 'swfl');
  IF n = 1 THEN NEW.assigned_technician_id := t;
  ELSIF n > 1 THEN NEW.needs_tech_choice := true;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER zz_appointments_auto_tech BEFORE INSERT OR UPDATE OF assigned_technician_id ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.auto_assign_region_tech();

CREATE OR REPLACE FUNCTION public.notify_tech_choice_needed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.needs_tech_choice THEN
    BEGIN PERFORM public._send_push_to_staff('Choose a technician', 'A new job has more than one tech in its region.', 'service_updates', '/admin?tab=repair-orders');
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER appointments_tech_choice_notify AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.notify_tech_choice_needed();