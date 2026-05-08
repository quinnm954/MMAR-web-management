CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  employee_type text NOT NULL DEFAULT 'technician',
  pay_basis text NOT NULL DEFAULT 'labor_hours',
  hourly_rate numeric NOT NULL DEFAULT 0,
  salary_amount numeric,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employees_type_chk CHECK (employee_type IN ('technician','service_advisor','manager','parts','admin','other')),
  CONSTRAINT employees_pay_basis_chk CHECK (pay_basis IN ('labor_hours','hourly_clock','salary','flat'))
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage employees" ON public.employees
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Managers view employees" ON public.employees
  FOR SELECT USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();