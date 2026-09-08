CREATE OR REPLACE FUNCTION public.guard_financing_contract_terms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  estimate_row public.estimates%ROWTYPE;
  approved_total numeric(10,2);
  parts_total numeric(10,2);
  labor_total numeric(10,2);
  expected_down numeric(10,2);
  expected_principal numeric(10,2);
  expected_interest numeric(10,2);
  expected_financed numeric(10,2);
  expected_monthly numeric(10,2);
BEGIN
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin'::public.app_role)
     OR public.has_role(auth.uid(), 'manager'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.estimate_id IS NULL OR NEW.customer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'A financing contract must use your own approved estimate';
  END IF;

  SELECT * INTO estimate_row
  FROM public.estimates
  WHERE id = NEW.estimate_id
    AND customer_id = auth.uid()
    AND status IN ('approved', 'partially_approved');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A financing contract must use your own approved estimate';
  END IF;

  SELECT
    COALESCE(sum(CASE WHEN item->>'status' IS DISTINCT FROM 'declined' THEN COALESCE((item->>'amount')::numeric, 0) ELSE 0 END), 0),
    COALESCE(sum(CASE WHEN item->>'status' IS DISTINCT FROM 'declined' AND COALESCE(item->>'kind', 'part') = 'part' THEN COALESCE((item->>'amount')::numeric, 0) ELSE 0 END), 0)
  INTO approved_total, parts_total
  FROM jsonb_array_elements(COALESCE(estimate_row.line_items, '[]'::jsonb)) AS item;

  labor_total := GREATEST(approved_total - parts_total, 0);
  expected_down := round(parts_total + labor_total * 0.50, 2);
  expected_principal := round(GREATEST(approved_total - expected_down, 0), 2);
  expected_interest := round(expected_principal * 0.25, 2);
  expected_financed := round(expected_principal + expected_interest, 2);
  expected_monthly := trunc((expected_financed / 12) * 100) / 100;

  NEW.total_service_price := round(approved_total, 2);
  NEW.down_payment := expected_down;
  NEW.principal := expected_principal;
  NEW.interest := expected_interest;
  NEW.total_financed := expected_financed;
  NEW.monthly_payment := expected_monthly;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_financing_contract_terms() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_financing_contract_terms() TO service_role;

DROP TRIGGER IF EXISTS guard_financing_contract_terms_trigger ON public.financing_contracts;
CREATE TRIGGER guard_financing_contract_terms_trigger
BEFORE INSERT OR UPDATE OF customer_id, estimate_id, total_service_price, down_payment, principal, interest, total_financed, monthly_payment
ON public.financing_contracts
FOR EACH ROW
EXECUTE FUNCTION public.guard_financing_contract_terms();