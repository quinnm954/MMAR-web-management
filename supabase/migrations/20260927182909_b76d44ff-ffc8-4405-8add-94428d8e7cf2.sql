ALTER TABLE public.phone_settings
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_agent_id text,
  ADD COLUMN IF NOT EXISTS ai_greeting text NOT NULL DEFAULT 'Hi, thanks for calling Mike''s Mobile Auto Repair! Mike is under a car right now, but I can help. What''s going on with your vehicle?',
  ADD COLUMN IF NOT EXISTS ai_summary_to_number text;
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS ai_handled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_transcript jsonb,
  ADD COLUMN IF NOT EXISTS ai_conversation_id text;