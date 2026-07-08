
-- Estimates: block customers from changing pricing / line items
CREATE OR REPLACE FUNCTION public.guard_estimate_customer_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.subtotal      IS DISTINCT FROM OLD.subtotal
  OR NEW.total         IS DISTINCT FROM OLD.total
  OR NEW.tax           IS DISTINCT FROM OLD.tax
  OR NEW.shop_supplies IS DISTINCT FROM OLD.shop_supplies
  OR NEW.discount_type IS DISTINCT FROM OLD.discount_type
  OR NEW.discount_value IS DISTINCT FROM OLD.discount_value
  OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
  OR NEW.discount_reason IS DISTINCT FROM OLD.discount_reason
  OR NEW.customer_id   IS DISTINCT FROM OLD.customer_id
  OR NEW.vehicle_id    IS DISTINCT FROM OLD.vehicle_id
  OR NEW.appointment_id IS DISTINCT FROM OLD.appointment_id
  OR NEW.estimate_number IS DISTINCT FROM OLD.estimate_number
  OR NEW.approval_token IS DISTINCT FROM OLD.approval_token
  THEN
    RAISE EXCEPTION 'Customers cannot modify pricing or identifying fields on estimates';
  END IF;

  -- Line items: allow only per-item status flips (approve/decline), not price edits
  IF NEW.line_items IS DISTINCT FROM OLD.line_items THEN
    IF jsonb_typeof(NEW.line_items) <> 'array'
       OR jsonb_typeof(OLD.line_items) <> 'array'
       OR jsonb_array_length(NEW.line_items) <> jsonb_array_length(OLD.line_items) THEN
      RAISE EXCEPTION 'Customers cannot add, remove, or restructure estimate line items';
    END IF;
    IF EXISTS (
      SELECT 1
        FROM jsonb_array_elements(NEW.line_items) WITH ORDINALITY AS n(item, idx)
        JOIN jsonb_array_elements(OLD.line_items) WITH ORDINALITY AS o(item, idx)
          ON n.idx = o.idx
       WHERE (n.item - 'status') <> (o.item - 'status')
    ) THEN
      RAISE EXCEPTION 'Customers can only change approval status on estimate line items';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_estimate_customer_update ON public.estimates;
CREATE TRIGGER trg_guard_estimate_customer_update
BEFORE UPDATE ON public.estimates
FOR EACH ROW EXECUTE FUNCTION public.guard_estimate_customer_update();

-- Memberships: block customers from changing billing/status fields
CREATE OR REPLACE FUNCTION public.guard_membership_customer_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.status                IS DISTINCT FROM OLD.status
  OR NEW.deposit_paid          IS DISTINCT FROM OLD.deposit_paid
  OR NEW.plan_id               IS DISTINCT FROM OLD.plan_id
  OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
  OR NEW.stripe_customer_id    IS DISTINCT FROM OLD.stripe_customer_id
  OR NEW.next_billing_date     IS DISTINCT FROM OLD.next_billing_date
  OR NEW.start_date            IS DISTINCT FROM OLD.start_date
  OR NEW.end_date              IS DISTINCT FROM OLD.end_date
  OR NEW.customer_id           IS DISTINCT FROM OLD.customer_id
  OR NEW.monthly_price         IS DISTINCT FROM OLD.monthly_price
  OR NEW.deposit_amount        IS DISTINCT FROM OLD.deposit_amount
  THEN
    RAISE EXCEPTION 'Customers cannot modify billing or status fields on memberships';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_membership_customer_update ON public.memberships;
CREATE TRIGGER trg_guard_membership_customer_update
BEFORE UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.guard_membership_customer_update();
