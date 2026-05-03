-- Lock down direct public inserts; submissions go through edge function (service role)
DROP POLICY IF EXISTS "Anyone can insert financing contracts" ON public.financing_contracts;
DROP POLICY IF EXISTS "Anyone can insert warranty acknowledgments" ON public.warranty_acknowledgments;

-- Make signatures bucket private
UPDATE storage.buckets SET public = false WHERE id = 'signatures';

-- Remove any prior open access policies on signatures
DROP POLICY IF EXISTS "Public read for signatures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload signatures" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Admins can read/manage signature files
CREATE POLICY "Admins can read signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage signatures"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'::app_role));