CREATE POLICY "Office staff read sms media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'sms-media' AND public.is_office_staff(auth.uid()));