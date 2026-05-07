ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS invoice_id uuid;
ALTER TABLE public.sms_threads ADD COLUMN IF NOT EXISTS last_invoice_id uuid;
CREATE INDEX IF NOT EXISTS idx_sms_messages_invoice_id ON public.sms_messages(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sms_threads_last_invoice_id ON public.sms_threads(last_invoice_id);
CREATE INDEX IF NOT EXISTS idx_sms_threads_customer_id ON public.sms_threads(customer_id);