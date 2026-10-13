DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
COMMENT ON TABLE public.message_threads IS 'DEPRECATED: in-app chat retired; communication is SMS/email/calls';
COMMENT ON TABLE public.messages IS 'DEPRECATED: in-app chat retired; communication is SMS/email/calls';
COMMENT ON TABLE public.message_reads IS 'DEPRECATED: in-app chat retired; communication is SMS/email/calls';