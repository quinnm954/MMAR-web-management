
-- Fix: customer read access on their own inspection photos (bucket is already private)
-- Path structure: {customer_id}/{vehicle_id}/{inspection_id}/{filename}
CREATE POLICY "Customers read own inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix: admin read access on suppressed_emails
CREATE POLICY "Admins can read suppressed emails"
ON public.suppressed_emails FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix: customer read access on their own parts catalog
CREATE POLICY "Customers view own parts catalog"
ON public.vehicle_parts_catalog FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Fix: admin INSERT/UPDATE on warranty_acknowledgments (previously no INSERT policy at all)
CREATE POLICY "Admins insert warranty acknowledgments"
ON public.warranty_acknowledgments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update warranty acknowledgments"
ON public.warranty_acknowledgments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
