ALTER TABLE public.technician_agreements ADD COLUMN employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;
CREATE INDEX technician_agreements_employee_id_idx ON public.technician_agreements(employee_id);
COMMENT ON COLUMN public.technician_agreements.employee_id IS 'Links the signed agreement to the employee record in Admin → Employees for per-employee record keeping.';