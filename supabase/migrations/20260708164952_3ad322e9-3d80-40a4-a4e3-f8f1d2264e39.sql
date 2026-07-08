-- Block customer INSERTs on service_checklist_items; only staff may add rows.
DROP POLICY IF EXISTS "Customers insert own checklist items" ON public.service_checklist_items;
DROP POLICY IF EXISTS "Customers add items to own checklists" ON public.service_checklist_items;
DROP POLICY IF EXISTS "Customers can insert checklist items" ON public.service_checklist_items;

-- Column-level guard for customer UPDATEs on service_checklist_items.
CREATE OR REPLACE FUNCTION public.guard_service_checklist_item_customer_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.checklist_id            IS DISTINCT FROM OLD.checklist_id
  OR NEW.label                   IS DISTINCT FROM OLD.label
  OR NEW.description             IS DISTINCT FROM OLD.description
  OR NEW.sort_order              IS DISTINCT FROM OLD.sort_order
  OR NEW.required                IS DISTINCT FROM OLD.required
  OR NEW.status                  IS DISTINCT FROM OLD.status
  OR NEW.completed_by            IS DISTINCT FROM OLD.completed_by
  OR NEW.completed_at            IS DISTINCT FROM OLD.completed_at
  OR NEW.severity                IS DISTINCT FROM OLD.severity
  OR NEW.recommended             IS DISTINCT FROM OLD.recommended
  OR NEW.recommended_at          IS DISTINCT FROM OLD.recommended_at
  OR NEW.recommended_by          IS DISTINCT FROM OLD.recommended_by
  OR NEW.estimate_id             IS DISTINCT FROM OLD.estimate_id
  OR NEW.price_low               IS DISTINCT FROM OLD.price_low
  OR NEW.price_high              IS DISTINCT FROM OLD.price_high
  OR NEW.source_template_item_id IS DISTINCT FROM OLD.source_template_item_id
  THEN
    RAISE EXCEPTION 'Customers cannot modify technician-recorded checklist fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_service_checklist_item_customer_update
  ON public.service_checklist_items;
CREATE TRIGGER trg_guard_service_checklist_item_customer_update
  BEFORE UPDATE ON public.service_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.guard_service_checklist_item_customer_update();
