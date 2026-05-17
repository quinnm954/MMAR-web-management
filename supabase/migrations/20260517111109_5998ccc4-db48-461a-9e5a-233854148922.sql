
CREATE TABLE public.inbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email text NOT NULL,
  from_name text,
  to_email text,
  subject text,
  body_text text,
  body_html text,
  thread_id uuid,
  in_reply_to text,
  message_id text,
  read_at timestamptz,
  archived_at timestamptz,
  raw jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_inbound_messages_received ON public.inbound_messages (received_at DESC);
CREATE INDEX idx_inbound_messages_thread ON public.inbound_messages (thread_id);
CREATE INDEX idx_inbound_messages_from ON public.inbound_messages (from_email);
ALTER TABLE public.inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage inbound messages"
  ON public.inbound_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role inserts inbound messages"
  ON public.inbound_messages FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE public.email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  recipient_email text,
  subject text,
  body text,
  thread_id uuid,
  in_reply_to_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_drafts_author ON public.email_drafts (author_id, updated_at DESC);
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage drafts"
  ON public.email_drafts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON public.email_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
