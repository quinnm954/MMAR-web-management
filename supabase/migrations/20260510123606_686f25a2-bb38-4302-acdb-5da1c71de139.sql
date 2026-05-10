
CREATE TABLE IF NOT EXISTS public.employee_pay_defaults (
  employee_type text PRIMARY KEY,
  pay_basis text NOT NULL DEFAULT 'labor_hours',
  hourly_rate numeric NOT NULL DEFAULT 0,
  salary_amount numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_pay_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage employee pay defaults"
  ON public.employee_pay_defaults
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff view employee pay defaults"
  ON public.employee_pay_defaults
  FOR SELECT
  USING (is_staff(auth.uid()));

CREATE TRIGGER update_employee_pay_defaults_updated_at
  BEFORE UPDATE ON public.employee_pay_defaults
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.employee_pay_defaults (employee_type, pay_basis, hourly_rate) VALUES
  ('technician', 'labor_hours', 25),
  ('service_advisor', 'hourly_clock', 22),
  ('manager', 'salary', 0),
  ('parts', 'hourly_clock', 20),
  ('admin', 'salary', 0),
  ('other', 'hourly_clock', 18)
ON CONFLICT (employee_type) DO NOTHING;
