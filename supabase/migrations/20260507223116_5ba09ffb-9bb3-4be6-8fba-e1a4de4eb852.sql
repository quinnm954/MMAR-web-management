-- Assigned technician on appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS assigned_technician_id uuid;

CREATE INDEX IF NOT EXISTS idx_appointments_assigned_tech
  ON public.appointments(assigned_technician_id);

-- Technicians can view appointments assigned to them
CREATE POLICY "Technicians view assigned appts"
ON public.appointments FOR SELECT
USING (assigned_technician_id = auth.uid() AND has_role(auth.uid(), 'technician'));

-- Technicians can update their assigned appointments (status, notes)
CREATE POLICY "Technicians update assigned appts"
ON public.appointments FOR UPDATE
USING (assigned_technician_id = auth.uid() AND has_role(auth.uid(), 'technician'));

-- Technicians can view vehicles for their assigned appointments
CREATE POLICY "Technicians view assigned vehicles"
ON public.vehicles FOR SELECT
USING (
  has_role(auth.uid(), 'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.vehicle_id = vehicles.id AND a.assigned_technician_id = auth.uid()
  )
);

-- Technicians can view customer profiles for their assigned appointments
CREATE POLICY "Technicians view assigned customer profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.customer_id = profiles.id AND a.assigned_technician_id = auth.uid()
  )
);

-- Technicians can insert service records for their assigned appointments
CREATE POLICY "Technicians log service for assigned appts"
ON public.service_records FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = service_records.appointment_id AND a.assigned_technician_id = auth.uid()
  )
);

-- Technicians can view service records they logged (for their appointments)
CREATE POLICY "Technicians view assigned service records"
ON public.service_records FOR SELECT
USING (
  has_role(auth.uid(), 'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = service_records.appointment_id AND a.assigned_technician_id = auth.uid()
  )
);
