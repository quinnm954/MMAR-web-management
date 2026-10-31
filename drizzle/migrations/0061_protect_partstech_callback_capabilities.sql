ALTER TABLE public.partstech_quotes ADD COLUMN callback_token_hash text;
ALTER TABLE public.partstech_quotes ADD COLUMN callback_expires_at timestamptz;
COMMENT ON COLUMN public.partstech_quotes.callback_token_hash IS 'SHA-256 of one session callback capability; raw token is only sent to PartsTech.';