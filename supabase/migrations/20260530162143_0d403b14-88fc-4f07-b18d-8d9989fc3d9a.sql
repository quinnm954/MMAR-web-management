CREATE POLICY "Customers view active visible templates"
ON public.checklist_templates FOR SELECT
TO authenticated
USING (is_active = true AND customer_visible = true);

CREATE POLICY "Customers view items of visible templates"
ON public.checklist_template_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.checklist_templates t
  WHERE t.id = checklist_template_items.template_id
    AND t.is_active = true
    AND t.customer_visible = true
));