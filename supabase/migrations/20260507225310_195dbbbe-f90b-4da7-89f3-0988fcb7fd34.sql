
-- Time tracking
CREATE TABLE public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL,
  appointment_id uuid NOT NULL,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  duration_minutes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage time entries" ON public.time_entries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians manage own time entries" ON public.time_entries
  FOR ALL USING (technician_id = auth.uid() AND has_role(auth.uid(), 'technician'::app_role))
  WITH CHECK (technician_id = auth.uid() AND has_role(auth.uid(), 'technician'::app_role));

CREATE TRIGGER trg_time_entries_updated
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Kanban
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS board_column text NOT NULL DEFAULT 'inbox',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- SMS
CREATE TABLE public.sms_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid,
  phone text NOT NULL UNIQUE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms threads" ON public.sms_threads
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_sms_threads_updated
  BEFORE UPDATE ON public.sms_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.sms_threads(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  body text NOT NULL,
  twilio_sid text,
  status text,
  sent_by uuid,
  media_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms messages" ON public.sms_messages
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE INDEX idx_sms_messages_thread ON public.sms_messages(thread_id, created_at DESC);
CREATE INDEX idx_time_entries_tech ON public.time_entries(technician_id, clock_in DESC);
CREATE INDEX idx_appointments_board ON public.appointments(board_column, sort_order);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_threads;
