GRANT DELETE ON public.messages TO authenticated;
GRANT DELETE ON public.message_threads TO authenticated;
CREATE POLICY "Admins delete messages" ON public.messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete message threads" ON public.message_threads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));