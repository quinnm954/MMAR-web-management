
-- Messaging tables
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tech_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (customer_id IS NOT NULL OR tech_id IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_threads TO authenticated;
GRANT ALL ON public.message_threads TO service_role;

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and staff can view threads"
  ON public.message_threads FOR SELECT TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = tech_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Staff can create threads"
  ON public.message_threads FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager')
      OR auth.uid() = customer_id
      OR auth.uid() = tech_id
    )
  );

CREATE POLICY "Participants and staff can update threads"
  ON public.message_threads FOR UPDATE TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = tech_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE TRIGGER trg_message_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in own threads"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
        AND (
          auth.uid() = t.customer_id
          OR auth.uid() = t.tech_id
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

CREATE POLICY "Send messages in own threads"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id
        AND (
          auth.uid() = t.customer_id
          OR auth.uid() = t.tech_id
          OR public.has_role(auth.uid(), 'admin')
          OR public.has_role(auth.uid(), 'manager')
        )
    )
  );

-- Per-user read marker
CREATE TABLE public.message_reads (
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reads TO authenticated;
GRANT ALL ON public.message_reads TO service_role;

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own read markers"
  ON public.message_reads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bump thread last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_thread_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.message_threads
     SET last_message_at = NEW.created_at,
         last_message_preview = LEFT(NEW.body, 140),
         updated_at = now()
   WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_thread_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_thread_on_message();

-- Unread count helper
CREATE OR REPLACE FUNCTION public.unread_message_count(_user_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(c), 0)::int FROM (
    SELECT COUNT(*) AS c
      FROM public.messages m
      JOIN public.message_threads t ON t.id = m.thread_id
      LEFT JOIN public.message_reads r ON r.thread_id = t.id AND r.user_id = _user_id
     WHERE m.sender_id <> _user_id
       AND (
         _user_id = t.customer_id
         OR _user_id = t.tech_id
         OR public.has_role(_user_id, 'admin')
         OR public.has_role(_user_id, 'manager')
       )
       AND m.created_at > COALESCE(r.last_read_at, 'epoch'::timestamptz)
     GROUP BY t.id
  ) s;
$$;

-- Add message_updates notification preference column
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS message_updates BOOLEAN NOT NULL DEFAULT true;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
