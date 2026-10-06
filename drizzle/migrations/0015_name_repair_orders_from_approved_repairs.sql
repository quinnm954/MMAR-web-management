CREATE OR REPLACE FUNCTION public.estimate_repair_name(_line_items jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  WITH items AS (
    SELECT
      ordinality,
      NULLIF(BTRIM(item->>'description'), '') AS description,
      COALESCE(NULLIF(item->>'kind', ''), 'part') AS kind,
      NULLIF(item->>'status', '') AS item_status,
      BOOL_OR(NULLIF(item->>'status', '') IS NOT NULL) OVER () AS has_item_status
    FROM jsonb_array_elements(COALESCE(_line_items, '[]'::jsonb)) WITH ORDINALITY AS lines(item, ordinality)
  ), approved AS (
    SELECT
      ordinality,
      REGEXP_REPLACE(description, '\s*\(book labor[^)]*\)\s*$', '', 'i') AS repair_name,
      kind
    FROM items
    WHERE description IS NOT NULL
      AND (NOT has_item_status OR item_status = 'approved')
  ), preferred AS (
    SELECT *
    FROM approved
    WHERE kind = 'labor'
       OR NOT EXISTS (SELECT 1 FROM approved WHERE kind = 'labor')
  ), deduped AS (
    SELECT repair_name, MIN(ordinality) AS first_position
    FROM preferred
    WHERE repair_name IS NOT NULL AND repair_name <> ''
    GROUP BY repair_name
    ORDER BY MIN(ordinality)
    LIMIT 3
  )
  SELECT NULLIF(LEFT(STRING_AGG(repair_name, ' + ' ORDER BY first_position), 160), '')
  FROM deduped;
$function$;

CREATE OR REPLACE FUNCTION public.estimate_to_repair_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_appt_id uuid;
  v_ro_number text;
  v_service_type text;
BEGIN
  IF NEW.status NOT IN ('approved','partially_approved') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_ro_number := NULLIF(NEW.estimate_number, '');
  v_service_type := COALESCE(
    public.estimate_repair_name(NEW.line_items),
    NULLIF(BTRIM(NEW.notes), ''),
    'Repair'
  );

  IF NEW.appointment_id IS NULL THEN
    INSERT INTO public.appointments (
      customer_id, vehicle_id, service_type, repair_order_number,
      status, board_column, priority, description
    ) VALUES (
      NEW.customer_id,
      NEW.vehicle_id,
      v_service_type,
      v_ro_number,
      'in_progress',
      'in_progress',
      'normal',
      COALESCE(NEW.notes, 'Auto-created from approved estimate')
    )
    RETURNING id INTO v_new_appt_id;

    UPDATE public.estimates
       SET appointment_id = v_new_appt_id,
           updated_at = now()
     WHERE id = NEW.id;
  ELSE
    UPDATE public.appointments
       SET status = CASE WHEN status IN ('completed','cancelled') THEN status ELSE 'in_progress' END,
           board_column = CASE WHEN board_column IN ('completed','cancelled') THEN board_column ELSE 'in_progress' END,
           service_type = CASE
             WHEN service_type = 'Approved Estimate' OR service_type LIKE 'EST-%' THEN v_service_type
             ELSE service_type
           END,
           repair_order_number = COALESCE(repair_order_number, v_ro_number),
           updated_at = now()
     WHERE id = NEW.appointment_id;
  END IF;

  RETURN NEW;
END;
$function$;