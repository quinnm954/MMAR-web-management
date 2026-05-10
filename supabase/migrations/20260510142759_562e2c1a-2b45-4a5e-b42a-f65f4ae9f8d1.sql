-- call_logs table
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  twilio_call_sid TEXT UNIQUE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  from_number TEXT,
  to_number TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  duration_seconds INTEGER,
  recording_url TEXT,
  recording_sid TEXT,
  transcription TEXT,
  voicemail BOOLEAN NOT NULL DEFAULT false,
  customer_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  answered_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_logs_created_at ON public.call_logs (created_at DESC);
CREATE INDEX idx_call_logs_from_number ON public.call_logs (from_number);
CREATE INDEX idx_call_logs_customer_id ON public.call_logs (customer_id);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage call logs"
ON public.call_logs FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_call_logs_updated_at
BEFORE UPDATE ON public.call_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- phone_settings table (single row, id=1)
CREATE TABLE public.phone_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  routing_enabled BOOLEAN NOT NULL DEFAULT false,
  forward_to_number TEXT,
  business_hours JSONB NOT NULL DEFAULT '{"mon":{"open":"08:00","close":"18:00"},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"18:00"},"sat":{"open":"09:00","close":"15:00"},"sun":null}'::jsonb,
  voicemail_greeting TEXT NOT NULL DEFAULT 'You have reached MMAR Care mobile mechanics. Please leave your name, vehicle, and service needed and we will text you right back.',
  unavailable_greeting TEXT NOT NULL DEFAULT 'Thanks for calling. We are upgrading our phone system. Please text this number or try back shortly.',
  record_calls BOOLEAN NOT NULL DEFAULT true,
  transcribe_voicemail BOOLEAN NOT NULL DEFAULT true,
  ring_timeout_seconds INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT phone_settings_singleton CHECK (id = 1)
);

INSERT INTO public.phone_settings (id) VALUES (1);

ALTER TABLE public.phone_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage phone settings"
ON public.phone_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_phone_settings_updated_at
BEFORE UPDATE ON public.phone_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();