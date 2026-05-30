-- Allow technicians to view (and update) inspections linked to appointments they are assigned to,
-- even when the inspection has no technician_id set yet.
CREATE POLICY "Technicians view assigned-appt inspections"
ON public.inspections
FOR SELECT
USING (
  has_role(auth.uid(), 'technician'::app_role)
  AND (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = inspections.appointment_id
        AND a.assigned_technician_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.customer_id = inspections.customer_id
        AND a.assigned_technician_id = auth.uid()
    )
  )
);

CREATE POLICY "Technicians update assigned-appt inspections"
ON public.inspections
FOR UPDATE
USING (
  has_role(auth.uid(), 'technician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = inspections.appointment_id
      AND a.assigned_technician_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'technician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = inspections.appointment_id
      AND a.assigned_technician_id = auth.uid()
  )
);

-- Same for inspection_items
CREATE POLICY "Technicians view assigned-appt inspection items"
ON public.inspection_items
FOR SELECT
USING (
  has_role(auth.uid(), 'technician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.appointments a ON a.id = i.appointment_id
    WHERE i.id = inspection_items.inspection_id
      AND a.assigned_technician_id = auth.uid()
  )
);

CREATE POLICY "Technicians update assigned-appt inspection items"
ON public.inspection_items
FOR UPDATE
USING (
  has_role(auth.uid(), 'technician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.appointments a ON a.id = i.appointment_id
    WHERE i.id = inspection_items.inspection_id
      AND a.assigned_technician_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'technician'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.inspections i
    JOIN public.appointments a ON a.id = i.appointment_id
    WHERE i.id = inspection_items.inspection_id
      AND a.assigned_technician_id = auth.uid()
  )
);