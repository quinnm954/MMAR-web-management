CREATE TABLE public.calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_blocks TO authenticated;
GRANT ALL ON public.calendar_blocks TO service_role;
CREATE POLICY "admins manage blocks" ON public.calendar_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.calendar_blocks (starts_at, ends_at, reason)
VALUES ('2026-10-14 15:00-04', '2026-10-14 20:00-04', 'Blocked off');