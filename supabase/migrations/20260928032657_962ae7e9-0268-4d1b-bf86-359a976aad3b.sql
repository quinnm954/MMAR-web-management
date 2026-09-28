drop policy if exists "Staff view employee pay defaults" on public.employee_pay_defaults;
create policy "Managers view employee pay defaults"
on public.employee_pay_defaults
for select
using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'manager'::app_role));