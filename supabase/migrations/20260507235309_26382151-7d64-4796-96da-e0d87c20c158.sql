-- is_staff helper
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','manager','service_advisor','technician','parts')
  )
$$;

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and managers view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uemail text;
  changed text[] := ARRAY[]::text[];
  k text;
BEGIN
  BEGIN
    SELECT email INTO uemail FROM auth.users WHERE id = uid;
  EXCEPTION WHEN OTHERS THEN uemail := NULL; END;

  IF TG_OP = 'UPDATE' THEN
    FOR k IN SELECT key FROM jsonb_each(to_jsonb(NEW)) LOOP
      IF to_jsonb(NEW) -> k IS DISTINCT FROM to_jsonb(OLD) -> k THEN
        changed := array_append(changed, k);
      END IF;
    END LOOP;
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, record_id, action, before_data, after_data, changed_fields)
    VALUES (uid, uemail, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), changed);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, record_id, action, after_data)
    VALUES (uid, uemail, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, table_name, record_id, action, before_data)
    VALUES (uid, uemail, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['invoices','estimates','appointments','service_records','memberships','user_roles']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();', t, t);
  END LOOP;
END $$;

-- RO ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.ro_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  uploaded_by uuid,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes integer,
  category text NOT NULL DEFAULT 'other',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ro_attachments_appt ON public.ro_attachments(appointment_id);

ALTER TABLE public.ro_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage ro attachments"
  ON public.ro_attachments FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Customers view own ro attachments"
  ON public.ro_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = ro_attachments.appointment_id
      AND a.customer_id = auth.uid()
  ));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ro-attachments','ro-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff read ro-attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ro-attachments' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff upload ro-attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ro-attachments' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff update ro-attachments"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'ro-attachments' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff delete ro-attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ro-attachments' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')));

CREATE POLICY "Customers read own ro-attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ro-attachments'
    AND EXISTS (
      SELECT 1 FROM public.ro_attachments r
      JOIN public.appointments a ON a.id = r.appointment_id
      WHERE r.file_path = storage.objects.name
        AND a.customer_id = auth.uid()
    )
  );