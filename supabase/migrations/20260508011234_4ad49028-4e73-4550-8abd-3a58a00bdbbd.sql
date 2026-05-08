
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT appointments_assigned_technician_id_fkey FOREIGN KEY (assigned_technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.service_records
  ADD CONSTRAINT service_records_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.service_recommendations
  ADD CONSTRAINT service_recommendations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.estimates
  ADD CONSTRAINT estimates_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT estimates_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD CONSTRAINT estimates_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD CONSTRAINT estimates_converted_to_invoice_id_fkey FOREIGN KEY (converted_to_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

ALTER TABLE public.inspections
  ADD CONSTRAINT inspections_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT inspections_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE,
  ADD CONSTRAINT inspections_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD CONSTRAINT inspections_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.ach_authorizations
  ADD CONSTRAINT ach_authorizations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries
  ADD CONSTRAINT time_entries_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE,
  ADD CONSTRAINT time_entries_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.customer_shares
  ADD CONSTRAINT customer_shares_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT customer_shares_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ro_attachments
  ADD CONSTRAINT ro_attachments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE,
  ADD CONSTRAINT ro_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.sms_threads
  ADD CONSTRAINT sms_threads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT sms_threads_last_invoice_id_fkey FOREIGN KEY (last_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

ALTER TABLE public.sms_messages
  ADD CONSTRAINT sms_messages_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT sms_messages_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
