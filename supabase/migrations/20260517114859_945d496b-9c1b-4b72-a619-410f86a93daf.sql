-- Schema additions
ALTER TABLE public.checklist_templates
  ADD COLUMN IF NOT EXISTS service_type_match text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS auto_attach boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS focus_area text;

ALTER TABLE public.service_checklist_items
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS recommended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recommended_at timestamptz,
  ADD COLUMN IF NOT EXISTS recommended_by uuid,
  ADD COLUMN IF NOT EXISTS estimate_id uuid;

ALTER TABLE public.service_checklist_items
  DROP CONSTRAINT IF EXISTS service_checklist_items_severity_check;
ALTER TABLE public.service_checklist_items
  ADD CONSTRAINT service_checklist_items_severity_check
  CHECK (severity IS NULL OR severity IN ('good','monitor','needs_service','urgent'));

-- Auto-attach trigger
CREATE OR REPLACE FUNCTION public.attach_inspection_checklists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    SELECT t.*
      FROM public.checklist_templates t
     WHERE t.is_active = true
       AND t.auto_attach = true
       AND t.service_type_match IS NOT NULL
       AND array_length(t.service_type_match, 1) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM unnest(t.service_type_match) kw
         WHERE v_st_lower LIKE '%' || lower(kw) || '%'
       )
  LOOP
    SELECT id INTO v_existing
      FROM public.service_checklists
     WHERE appointment_id = NEW.id AND template_id = v_tpl.id
     LIMIT 1;
    IF v_existing IS NOT NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.service_checklists (
      template_id, customer_id, vehicle_id, appointment_id,
      assigned_technician_id, title, customer_visible, status
    ) VALUES (
      v_tpl.id, NEW.customer_id, NEW.vehicle_id, NEW.id,
      NEW.assigned_technician_id, v_tpl.name, v_tpl.customer_visible, 'open'
    ) RETURNING id INTO v_new_id;

    INSERT INTO public.service_checklist_items (checklist_id, label, description, sort_order, required)
    SELECT v_new_id, label, description, sort_order, required
      FROM public.checklist_template_items
     WHERE template_id = v_tpl.id
     ORDER BY sort_order;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_appt_attach_inspections_ins ON public.appointments;
DROP TRIGGER IF EXISTS tr_appt_attach_inspections_upd ON public.appointments;

CREATE TRIGGER tr_appt_attach_inspections_ins
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.attach_inspection_checklists();

CREATE TRIGGER tr_appt_attach_inspections_upd
AFTER UPDATE OF service_type ON public.appointments
FOR EACH ROW
WHEN (OLD.service_type IS DISTINCT FROM NEW.service_type)
EXECUTE FUNCTION public.attach_inspection_checklists();

-- Recommend → estimate line RPC
CREATE OR REPLACE FUNCTION public.recommend_checklist_item(_item_id uuid, _labor_hours numeric DEFAULT 1, _unit_price numeric DEFAULT 0, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item public.service_checklist_items;
  v_cl public.service_checklists;
  v_est public.estimates;
  v_line jsonb;
  v_items jsonb;
  v_subtotal numeric := 0;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'technician')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_item FROM public.service_checklist_items WHERE id = _item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not found'; END IF;

  SELECT * INTO v_cl FROM public.service_checklists WHERE id = v_item.checklist_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Checklist not found'; END IF;

  -- find or create a draft estimate for this customer/vehicle (prefer one tied to the appointment)
  SELECT * INTO v_est
    FROM public.estimates
   WHERE customer_id = v_cl.customer_id
     AND status IN ('draft','sent')
     AND (v_cl.appointment_id IS NULL OR appointment_id = v_cl.appointment_id OR appointment_id IS NULL)
   ORDER BY (appointment_id = v_cl.appointment_id) DESC NULLS LAST, created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.estimates (
      customer_id, vehicle_id, appointment_id, status, line_items, subtotal, total, notes
    ) VALUES (
      v_cl.customer_id, v_cl.vehicle_id, v_cl.appointment_id, 'draft', '[]'::jsonb, 0, 0,
      'Auto-created from inspection recommendations'
    ) RETURNING * INTO v_est;
  END IF;

  v_line := jsonb_build_object(
    'description', v_item.label || COALESCE(' — ' || _note, ''),
    'quantity', 1,
    'unit_price', COALESCE(_unit_price, 0),
    'amount', COALESCE(_unit_price, 0),
    'kind', 'part',
    'labor_hours', _labor_hours,
    'source', 'inspection_recommend',
    'checklist_item_id', _item_id
  );

  v_items := COALESCE(v_est.line_items, '[]'::jsonb) || jsonb_build_array(v_line);

  SELECT COALESCE(SUM(COALESCE((li->>'amount')::numeric, 0)), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(v_items) li;

  UPDATE public.estimates
     SET line_items = v_items,
         subtotal = v_subtotal,
         total = v_subtotal,
         updated_at = now()
   WHERE id = v_est.id;

  UPDATE public.service_checklist_items
     SET recommended = true,
         recommended_at = now(),
         recommended_by = auth.uid(),
         estimate_id = v_est.id,
         status = CASE WHEN status = 'pending' THEN 'issue' ELSE status END
   WHERE id = _item_id;

  RETURN jsonb_build_object('estimate_id', v_est.id);
END;
$$;

-- Seed templates
DO $seed$
DECLARE
  v_tpl_id uuid;
  v_items text[];
  v_idx int;
BEGIN
  -- Oil change → under-hood + undercarriage
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'Oil Change Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('Oil Change Inspection', 'Under-hood and undercarriage checks while on the lift', 'inspection',
            'Under-hood + undercarriage', true, true,
            ARRAY['oil change','oil','lube'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Engine oil leaks','Coolant level and condition','Brake fluid level','Power steering fluid','Air filter','Cabin air filter','Serpentine belt','Radiator hoses','CV axle boots','Exhaust system','Motor mounts','Tire tread and pressure','Wiper blades'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;

  -- Brake job → suspension + wheel area
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'Brake Job Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('Brake Job Inspection', 'Wheel-off suspension and brake-area inspection', 'inspection',
            'Suspension + wheel area', true, true,
            ARRAY['brake','brakes','pad','rotor'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Brake pads remaining','Rotor condition and thickness','Calipers and slide pins','Brake lines and hoses','Struts / shocks','Tie rod ends','Ball joints','Control arm bushings','Sway bar links','Wheel bearings','Tire tread and wear pattern','Lug nuts torque'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;

  -- Tires / alignment → steering + front end
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'Tires & Alignment Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('Tires & Alignment Inspection', 'Steering and front-end check while tires are off', 'inspection',
            'Steering + front end', true, true,
            ARRAY['tire','tires','alignment','rotation'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Tread depth all 4','Sidewall damage','Ball joints','Tie rod ends (inner/outer)','Control arms and bushings','Sway bar links','Wheel bearings','Steering rack boots','Strut bearing plates','Alignment wear indicators'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;

  -- Battery / electrical → charging system
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'Battery & Charging Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('Battery & Charging Inspection', 'Charging system adjacency check', 'inspection',
            'Charging system', true, true,
            ARRAY['battery','electrical','alternator','starter'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Battery load test','Battery terminals and clamps','Ground straps','Alternator output','Starter draw','Drive belt tension','Charging system harness','Corrosion / acid leak'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;

  -- Coolant / radiator → cooling system
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'Cooling System Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('Cooling System Inspection', 'Cooling system check while system is open', 'inspection',
            'Cooling system', true, true,
            ARRAY['coolant','radiator','cooling','flush','antifreeze'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Upper / lower radiator hoses','Heater hoses','Water pump weep / play','Thermostat operation','Radiator cap','Cooling fan operation','Overflow / expansion tank','Coolant pH and freeze point'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;

  -- Transmission service → drivetrain
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'Transmission Service Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('Transmission Service Inspection', 'Drivetrain adjacency check', 'inspection',
            'Drivetrain', true, true,
            ARRAY['transmission','trans','drivetrain','differential','diff'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Transmission mounts','Engine mounts','CV axles and boots','Driveshaft U-joints','Transfer case fluid','Differential seals','Transmission cooler lines','Pan / case leaks'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;

  -- AC service → HVAC + belts
  IF NOT EXISTS (SELECT 1 FROM public.checklist_templates WHERE name = 'AC Service Inspection') THEN
    INSERT INTO public.checklist_templates (name, description, category, focus_area, customer_visible, auto_attach, service_type_match)
    VALUES ('AC Service Inspection', 'HVAC and belt-area inspection', 'inspection',
            'HVAC + belts', true, true,
            ARRAY['ac','a/c','air conditioning','hvac','refrigerant'])
    RETURNING id INTO v_tpl_id;
    v_items := ARRAY['Compressor clutch engagement','Refrigerant pressures (high/low)','Condenser fins and airflow','Cabin air filter','Blower motor operation','Drive belt and tensioner','AC lines for oil residue','Evaporator drain'];
    FOR v_idx IN 1..array_length(v_items, 1) LOOP
      INSERT INTO public.checklist_template_items (template_id, label, sort_order) VALUES (v_tpl_id, v_items[v_idx], v_idx - 1);
    END LOOP;
  END IF;
END $seed$;