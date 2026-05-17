
ALTER TABLE public.checklist_template_items
  ADD COLUMN IF NOT EXISTS price_low numeric,
  ADD COLUMN IF NOT EXISTS price_high numeric;

ALTER TABLE public.service_checklist_items
  ADD COLUMN IF NOT EXISTS price_low numeric,
  ADD COLUMN IF NOT EXISTS price_high numeric;

CREATE OR REPLACE FUNCTION public.create_checklist_from_template(
  _template_id uuid,
  _customer_id uuid,
  _vehicle_id uuid DEFAULT NULL,
  _appointment_id uuid DEFAULT NULL,
  _membership_id uuid DEFAULT NULL,
  _assigned_technician_id uuid DEFAULT NULL,
  _title_override text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tpl public.checklist_templates;
  v_new_id uuid;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_tpl FROM public.checklist_templates WHERE id = _template_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found'; END IF;

  INSERT INTO public.service_checklists (
    template_id, customer_id, vehicle_id, appointment_id, membership_id,
    assigned_technician_id, title, customer_visible, status
  ) VALUES (
    _template_id, _customer_id, _vehicle_id, _appointment_id, _membership_id,
    _assigned_technician_id, COALESCE(_title_override, v_tpl.name), v_tpl.customer_visible, 'open'
  ) RETURNING id INTO v_new_id;

  INSERT INTO public.service_checklist_items (checklist_id, label, description, sort_order, required, price_low, price_high)
  SELECT v_new_id, label, description, sort_order, required, price_low, price_high
    FROM public.checklist_template_items
   WHERE template_id = _template_id
   ORDER BY sort_order;

  RETURN v_new_id;
END;
$$;
