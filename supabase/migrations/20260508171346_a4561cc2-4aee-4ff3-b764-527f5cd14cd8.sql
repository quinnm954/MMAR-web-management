CREATE TABLE public.employee_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employee_shifts_user_clock ON public.employee_shifts(user_id, clock_in DESC);

ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage shifts"
ON public.employee_shifts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Staff manage own shifts"
ON public.employee_shifts FOR ALL
USING (user_id = auth.uid() AND is_staff(auth.uid()))
WITH CHECK (user_id = auth.uid() AND is_staff(auth.uid()));

CREATE TRIGGER update_employee_shifts_updated_at
BEFORE UPDATE ON public.employee_shifts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();