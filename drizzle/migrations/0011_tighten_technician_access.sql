CREATE OR REPLACE FUNCTION public.is_office_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('owner','admin','manager','service_advisor'))
$$;

CREATE OR REPLACE FUNCTION public.tech_has_vehicle(_user_id uuid, _vehicle_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(_user_id,'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.vehicle_id = _vehicle_id AND a.assigned_technician_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.tech_has_appointment(_user_id uuid, _appt uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(_user_id,'technician') AND EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.id = _appt AND a.assigned_technician_id = _user_id)
$$;

ALTER POLICY "Staff update appointments" ON public.appointments USING (is_office_staff(auth.uid())) WITH CHECK (is_office_staff(auth.uid()));
ALTER POLICY "Staff view appointments" ON public.appointments USING (is_office_staff(auth.uid()));
ALTER POLICY "Staff can view all device tokens" ON public.device_tokens USING (is_office_staff(auth.uid()));
ALTER POLICY "Staff can view all notification preferences" ON public.notification_preferences USING (is_office_staff(auth.uid()));
ALTER POLICY "Staff manage fleets" ON public.fleet_accounts USING (is_office_staff(auth.uid())) WITH CHECK (is_office_staff(auth.uid()));
ALTER POLICY "Staff manage invoice payments" ON public.invoice_payments USING (is_office_staff(auth.uid())) WITH CHECK (is_office_staff(auth.uid()));
ALTER POLICY "Staff view mileage tokens" ON public.mileage_update_tokens USING (is_office_staff(auth.uid()));
ALTER POLICY "Staff delete feedback" ON public.review_feedback USING (is_office_staff(auth.uid()));
ALTER POLICY "Staff read feedback" ON public.review_feedback USING (is_office_staff(auth.uid()));
ALTER POLICY "Staff update feedback" ON public.review_feedback USING (is_office_staff(auth.uid())) WITH CHECK (is_office_staff(auth.uid()));

ALTER POLICY "Staff manage ro attachments" ON public.ro_attachments
  USING (is_office_staff(auth.uid()) OR tech_has_appointment(auth.uid(), appointment_id))
  WITH CHECK (is_office_staff(auth.uid()) OR tech_has_appointment(auth.uid(), appointment_id));
ALTER POLICY "Staff manage master checklist" ON public.vehicle_master_checklist_items
  USING (is_office_staff(auth.uid()) OR tech_has_vehicle(auth.uid(), vehicle_id))
  WITH CHECK (is_office_staff(auth.uid()) OR tech_has_vehicle(auth.uid(), vehicle_id));
ALTER POLICY "Staff manage mileage logs" ON public.vehicle_mileage_logs
  USING (is_office_staff(auth.uid()) OR tech_has_vehicle(auth.uid(), vehicle_id))
  WITH CHECK (is_office_staff(auth.uid()) OR tech_has_vehicle(auth.uid(), vehicle_id));
ALTER POLICY "Customers view own mileage logs" ON public.vehicle_mileage_logs
  USING (customer_id = auth.uid() OR is_office_staff(auth.uid()) OR tech_has_vehicle(auth.uid(), vehicle_id));
ALTER POLICY "Customers insert own mileage logs" ON public.vehicle_mileage_logs
  WITH CHECK (customer_id = auth.uid() OR is_office_staff(auth.uid()) OR tech_has_vehicle(auth.uid(), vehicle_id) OR auth.role() = 'service_role');