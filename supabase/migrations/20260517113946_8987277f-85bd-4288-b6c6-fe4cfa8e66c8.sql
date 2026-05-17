CREATE POLICY "Customers update own checklists" ON public.service_checklists
FOR UPDATE USING (customer_id = auth.uid() AND customer_visible = true)
WITH CHECK (customer_id = auth.uid() AND customer_visible = true);

CREATE POLICY "Customers update own checklist items" ON public.service_checklist_items
FOR UPDATE USING (EXISTS (SELECT 1 FROM service_checklists sc WHERE sc.id = service_checklist_items.checklist_id AND sc.customer_id = auth.uid() AND sc.customer_visible = true))
WITH CHECK (EXISTS (SELECT 1 FROM service_checklists sc WHERE sc.id = service_checklist_items.checklist_id AND sc.customer_id = auth.uid() AND sc.customer_visible = true));

CREATE POLICY "Customers insert own checklist items" ON public.service_checklist_items
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM service_checklists sc WHERE sc.id = service_checklist_items.checklist_id AND sc.customer_id = auth.uid() AND sc.customer_visible = true));

CREATE POLICY "Customers delete own checklist items" ON public.service_checklist_items
FOR DELETE USING (EXISTS (SELECT 1 FROM service_checklists sc WHERE sc.id = service_checklist_items.checklist_id AND sc.customer_id = auth.uid() AND sc.customer_visible = true));