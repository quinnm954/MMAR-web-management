
-- 1) Track source template item on per-job inspection items for sync
ALTER TABLE public.service_checklist_items
  ADD COLUMN IF NOT EXISTS source_template_item_id uuid REFERENCES public.checklist_template_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sci_template_item ON public.service_checklist_items(source_template_item_id);

-- 2) Master per-vehicle health checklist
CREATE TABLE IF NOT EXISTS public.vehicle_master_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'General',
  label text NOT NULL,
  label_key text GENERATED ALWAYS AS (lower(btrim(label))) STORED,
  description text,
  status text NOT NULL DEFAULT 'unknown',
  measurement text,
  severity_note text,
  customer_note text,
  price_low numeric,
  price_high numeric,
  source_template_id uuid,
  source_template_item_id uuid,
  last_checked_at timestamptz,
  last_checked_by uuid,
  last_source text NOT NULL DEFAULT 'seed',
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vmci_status_chk CHECK (status IN ('good','monitor','due_soon','urgent','unknown')),
  CONSTRAINT vmci_source_chk CHECK (last_source IN ('seed','tech_inspection','customer_edit','admin_edit'))
);
CREATE UNIQUE INDEX IF NOT EXISTS vmci_vehicle_label_uq ON public.vehicle_master_checklist_items(vehicle_id, label_key);
CREATE INDEX IF NOT EXISTS vmci_vehicle_idx ON public.vehicle_master_checklist_items(vehicle_id);
CREATE INDEX IF NOT EXISTS vmci_customer_idx ON public.vehicle_master_checklist_items(customer_id);

CREATE TRIGGER vmci_set_updated_at
  BEFORE UPDATE ON public.vehicle_master_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vehicle_master_checklist_items ENABLE ROW LEVEL SECURITY;

-- Staff: full access
CREATE POLICY "Staff manage master checklist"
  ON public.vehicle_master_checklist_items
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- Customer: read own
CREATE POLICY "Customers view own master checklist"
  ON public.vehicle_master_checklist_items
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

-- Customer: update only their own rows (mutable column control enforced by trigger below)
CREATE POLICY "Customers update own master checklist"
  ON public.vehicle_master_checklist_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- 3) Trigger: customers can only mutate status/customer_note/measurement; stamp last_source
CREATE OR REPLACE FUNCTION public.vmci_guard_customer_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_is_staff boolean := public.is_staff(auth.uid());
BEGIN
  IF NOT v_is_staff THEN
    -- Customer path: lock down everything except a small whitelist
    NEW.vehicle_id := OLD.vehicle_id;
    NEW.customer_id := OLD.customer_id;
    NEW.label := OLD.label;
    NEW.category := OLD.category;
    NEW.description := OLD.description;
    NEW.price_low := OLD.price_low;
    NEW.price_high := OLD.price_high;
    NEW.source_template_id := OLD.source_template_id;
    NEW.source_template_item_id := OLD.source_template_item_id;
    NEW.is_hidden := OLD.is_hidden;
    NEW.sort_order := OLD.sort_order;
    NEW.severity_note := OLD.severity_note;
    NEW.last_source := 'customer_edit';
    NEW.last_checked_by := auth.uid();
    NEW.last_checked_at := now();
  ELSE
    IF NEW.last_source IS NULL OR NEW.last_source = OLD.last_source THEN
      NEW.last_source := 'admin_edit';
    END IF;
    IF NEW.last_checked_at IS NULL OR NEW.last_checked_at = OLD.last_checked_at THEN
      NEW.last_checked_at := now();
    END IF;
    IF NEW.last_checked_by IS NULL THEN
      NEW.last_checked_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER vmci_guard_updates
  BEFORE UPDATE ON public.vehicle_master_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.vmci_guard_customer_updates();

-- 4) Seed function: pull all active template items into a vehicle's master checklist
CREATE OR REPLACE FUNCTION public.seed_vehicle_master_checklist(_vehicle_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_customer_id uuid;
  v_inserted int := 0;
BEGIN
  SELECT owner_id INTO v_customer_id FROM public.vehicles WHERE id = _vehicle_id;
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Vehicle not found or has no owner';
  END IF;
  IF NOT (public.is_staff(auth.uid()) OR auth.uid() = v_customer_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.vehicle_master_checklist_items (
    vehicle_id, customer_id, category, label, description,
    price_low, price_high, source_template_id, source_template_item_id, last_source, sort_order
  )
  SELECT
    _vehicle_id, v_customer_id,
    COALESCE(t.name, 'General'),
    i.label, i.description,
    i.price_low, i.price_high,
    t.id, i.id, 'seed', i.sort_order
  FROM public.checklist_template_items i
  JOIN public.checklist_templates t ON t.id = i.template_id
  WHERE t.is_active = true
  ON CONFLICT (vehicle_id, label_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END $$;

-- 5) Sync trigger: when a tech updates a job checklist item, push it to master
CREATE OR REPLACE FUNCTION public.sync_master_from_tech_checklist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cl public.service_checklists;
  v_tpl_name text;
  v_master_status text;
  v_existing public.vehicle_master_checklist_items;
  v_severity_rank int;
  v_existing_rank int;
  rank_map jsonb := '{"good":1,"monitor":2,"due_soon":3,"urgent":4}'::jsonb;
BEGIN
  IF NEW.severity IS NULL AND NEW.notes IS NULL AND NEW.status = 'pending' AND NOT NEW.recommended THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.severity IS NOT DISTINCT FROM OLD.severity
     AND NEW.notes IS NOT DISTINCT FROM OLD.notes
     AND NEW.recommended IS NOT DISTINCT FROM OLD.recommended
     AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_cl FROM public.service_checklists WHERE id = NEW.checklist_id;
  IF v_cl.vehicle_id IS NULL OR v_cl.customer_id IS NULL THEN RETURN NEW; END IF;

  SELECT name INTO v_tpl_name FROM public.checklist_templates WHERE id = v_cl.template_id;

  v_master_status := CASE
    WHEN NEW.recommended AND NEW.severity = 'urgent' THEN 'urgent'
    WHEN NEW.severity = 'urgent' THEN 'urgent'
    WHEN NEW.severity = 'needs_service' THEN 'due_soon'
    WHEN NEW.severity = 'monitor' THEN 'monitor'
    WHEN NEW.severity = 'good' OR NEW.status = 'ok' OR NEW.status = 'pass' THEN 'good'
    WHEN NEW.recommended THEN 'due_soon'
    ELSE 'unknown'
  END;

  SELECT * INTO v_existing
    FROM public.vehicle_master_checklist_items
   WHERE vehicle_id = v_cl.vehicle_id
     AND (
       (NEW.source_template_item_id IS NOT NULL AND source_template_item_id = NEW.source_template_item_id)
       OR label_key = lower(btrim(NEW.label))
     )
   ORDER BY (source_template_item_id IS NOT NULL) DESC
   LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    -- Respect recent customer edits unless tech finding is more severe
    IF v_existing.last_source = 'customer_edit'
       AND v_existing.last_checked_at > now() - INTERVAL '30 days' THEN
      v_severity_rank := COALESCE((rank_map->>v_master_status)::int, 0);
      v_existing_rank := COALESCE((rank_map->>v_existing.status)::int, 0);
      IF v_severity_rank <= v_existing_rank THEN
        RETURN NEW;
      END IF;
    END IF;

    UPDATE public.vehicle_master_checklist_items
       SET status = v_master_status,
           severity_note = COALESCE(NEW.notes, severity_note),
           source_template_item_id = COALESCE(source_template_item_id, NEW.source_template_item_id),
           last_checked_at = now(),
           last_checked_by = COALESCE(NEW.completed_by, NEW.recommended_by, auth.uid()),
           last_source = 'tech_inspection',
           is_hidden = false,
           updated_at = now()
     WHERE id = v_existing.id;
  ELSE
    INSERT INTO public.vehicle_master_checklist_items (
      vehicle_id, customer_id, category, label, description, status,
      severity_note, source_template_id, source_template_item_id,
      last_checked_at, last_checked_by, last_source
    ) VALUES (
      v_cl.vehicle_id, v_cl.customer_id, COALESCE(v_tpl_name, 'General'),
      NEW.label, NEW.description, v_master_status,
      NEW.notes, v_cl.template_id, NEW.source_template_item_id,
      now(), COALESCE(NEW.completed_by, NEW.recommended_by, auth.uid()),
      'tech_inspection'
    )
    ON CONFLICT (vehicle_id, label_key) DO UPDATE
      SET status = EXCLUDED.status,
          severity_note = EXCLUDED.severity_note,
          last_checked_at = EXCLUDED.last_checked_at,
          last_checked_by = EXCLUDED.last_checked_by,
          last_source = EXCLUDED.last_source;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sci_sync_master ON public.service_checklist_items;
CREATE TRIGGER sci_sync_master
  AFTER INSERT OR UPDATE ON public.service_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_master_from_tech_checklist();

-- 6) Update existing template-instantiation functions to carry template_item_id
CREATE OR REPLACE FUNCTION public.create_checklist_from_template(_template_id uuid, _customer_id uuid, _vehicle_id uuid DEFAULT NULL::uuid, _appointment_id uuid DEFAULT NULL::uuid, _membership_id uuid DEFAULT NULL::uuid, _assigned_technician_id uuid DEFAULT NULL::uuid, _title_override text DEFAULT NULL::text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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

  INSERT INTO public.service_checklist_items (checklist_id, label, description, sort_order, required, price_low, price_high, source_template_item_id)
  SELECT v_new_id, label, description, sort_order, required, price_low, price_high, id
    FROM public.checklist_template_items
   WHERE template_id = _template_id
   ORDER BY sort_order;

  RETURN v_new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.attach_inspection_checklists()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_tpl record;
  v_new_id uuid;
  v_st_lower text := lower(COALESCE(NEW.service_type, ''));
  v_existing uuid;
BEGIN
  IF v_st_lower = '' OR NEW.customer_id IS NULL THEN
    RETURN NEW;
  END IF;
  FOR v_tpl IN
    SELECT t.* FROM public.checklist_templates t
     WHERE t.is_active = true AND t.auto_attach = true
       AND t.service_type_match IS NOT NULL
       AND array_length(t.service_type_match, 1) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM unnest(t.service_type_match) kw
         WHERE v_st_lower LIKE '%' || lower(kw) || '%'
       )
  LOOP
    SELECT id INTO v_existing FROM public.service_checklists
     WHERE appointment_id = NEW.id AND template_id = v_tpl.id LIMIT 1;
    IF v_existing IS NOT NULL THEN CONTINUE; END IF;

    INSERT INTO public.service_checklists (
      template_id, customer_id, vehicle_id, appointment_id,
      assigned_technician_id, title, customer_visible, status
    ) VALUES (
      v_tpl.id, NEW.customer_id, NEW.vehicle_id, NEW.id,
      NEW.assigned_technician_id, v_tpl.name, v_tpl.customer_visible, 'open'
    ) RETURNING id INTO v_new_id;

    INSERT INTO public.service_checklist_items (checklist_id, label, description, sort_order, required, price_low, price_high, source_template_item_id)
    SELECT v_new_id, label, description, sort_order, required, price_low, price_high, id
      FROM public.checklist_template_items
     WHERE template_id = v_tpl.id
     ORDER BY sort_order;
  END LOOP;
  RETURN NEW;
END;
$function$;
