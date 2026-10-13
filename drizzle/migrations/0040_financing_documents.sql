CREATE TABLE public.financing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.financing_contracts(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financing_documents TO authenticated;
GRANT ALL ON public.financing_documents TO service_role;
ALTER TABLE public.financing_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage financing documents" ON public.financing_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE public.financing_payments ADD COLUMN IF NOT EXISTS note text;
CREATE POLICY "Admins manage financing docs files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'financing-docs' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'financing-docs' AND public.has_role(auth.uid(), 'admin'::app_role));