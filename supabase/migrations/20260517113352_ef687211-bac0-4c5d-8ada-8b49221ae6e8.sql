
-- 1. checklist_templates
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'custom',
  plan_id uuid REFERENCES public.membership_plans(id) ON DELETE SET NULL,
  customer_visible boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage checklist templates"
ON public.checklist_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff view checklist templates"
ON public.checklist_templates FOR SELECT
USING (is_staff(auth.uid()));

CREATE TRIGGER tr_checklist_templates_updated
BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. checklist_template_items
CREATE TABLE public.checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cti_template ON public.checklist_template_items(template_id, sort_order);
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage checklist template items"
ON public.checklist_template_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff view checklist template items"
ON public.checklist_template_items FOR SELECT
USING (is_staff(auth.uid()));

-- 3. service_checklists (instances)
CREATE TABLE public.service_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.checklist_templates(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL,
  vehicle_id uuid,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  assigned_technician_id uuid,
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'open',
  customer_visible boolean NOT NULL DEFAULT true,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sc_customer ON public.service_checklists(customer_id);
CREATE INDEX idx_sc_tech ON public.service_checklists(assigned_technician_id);
CREATE INDEX idx_sc_appt ON public.service_checklists(appointment_id);
ALTER TABLE public.service_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service checklists"
ON public.service_checklists FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians view assigned checklists"
ON public.service_checklists FOR SELECT
USING (assigned_technician_id = auth.uid() AND has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Technicians update assigned checklists"
ON public.service_checklists FOR UPDATE
USING (assigned_technician_id = auth.uid() AND has_role(auth.uid(), 'technician'::app_role))
WITH CHECK (assigned_technician_id = auth.uid() AND has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Customers view own visible checklists"
ON public.service_checklists FOR SELECT
USING (customer_id = auth.uid() AND customer_visible = true);

CREATE TRIGGER tr_service_checklists_updated
BEFORE UPDATE ON public.service_checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. service_checklist_items
CREATE TABLE public.service_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.service_checklists(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  required boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sci_checklist ON public.service_checklist_items(checklist_id, sort_order);
ALTER TABLE public.service_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage service checklist items"
ON public.service_checklist_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians view assigned checklist items"
ON public.service_checklist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.service_checklists sc
  WHERE sc.id = service_checklist_items.checklist_id
    AND sc.assigned_technician_id = auth.uid()
    AND has_role(auth.uid(), 'technician'::app_role)
));

CREATE POLICY "Technicians update assigned checklist items"
ON public.service_checklist_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.service_checklists sc
  WHERE sc.id = service_checklist_items.checklist_id
    AND sc.assigned_technician_id = auth.uid()
    AND has_role(auth.uid(), 'technician'::app_role)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.service_checklists sc
  WHERE sc.id = service_checklist_items.checklist_id
    AND sc.assigned_technician_id = auth.uid()
    AND has_role(auth.uid(), 'technician'::app_role)
));

CREATE POLICY "Customers view own visible checklist items"
ON public.service_checklist_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.service_checklists sc
  WHERE sc.id = service_checklist_items.checklist_id
    AND sc.customer_id = auth.uid()
    AND sc.customer_visible = true
));

CREATE TRIGGER tr_service_checklist_items_updated
BEFORE UPDATE ON public.service_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RPC to spawn a checklist instance from a template (snapshots items)
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

  INSERT INTO public.service_checklist_items (checklist_id, label, description, sort_order, required)
  SELECT v_new_id, label, description, sort_order, required
    FROM public.checklist_template_items
   WHERE template_id = _template_id
   ORDER BY sort_order;

  RETURN v_new_id;
END;
$$;
