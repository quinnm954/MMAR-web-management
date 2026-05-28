-- 1. invoice_payments table to track split/multi-method payments
CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash',
  reference text,
  notes text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_paid_at ON public.invoice_payments(paid_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoice_payments TO service_role;

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage invoice payments"
  ON public.invoice_payments
  FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Customers view their own invoice payments"
  ON public.invoice_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_payments.invoice_id
        AND i.customer_id = auth.uid()
    )
  );

CREATE TRIGGER trg_invoice_payments_updated_at
  BEFORE UPDATE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Recompute invoices.amount_paid / status from sum of invoice_payments
CREATE OR REPLACE FUNCTION public.recalc_invoice_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice_id uuid := COALESCE(NEW.invoice_id, OLD.invoice_id);
  v_total numeric;
  v_paid numeric;
  v_latest timestamptz;
  v_status text;
  v_current_status text;
BEGIN
  SELECT total, status INTO v_total, v_current_status
    FROM public.invoices WHERE id = v_invoice_id;
  IF v_total IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT COALESCE(SUM(amount), 0), MAX(paid_at)
    INTO v_paid, v_latest
    FROM public.invoice_payments
   WHERE invoice_id = v_invoice_id;

  IF v_current_status IN ('void','refunded') THEN
    v_status := v_current_status;
  ELSIF v_paid <= 0 THEN
    v_status := 'unpaid';
  ELSIF v_paid + 0.005 < v_total THEN
    v_status := 'partial';
  ELSE
    v_status := 'paid';
  END IF;

  UPDATE public.invoices
     SET amount_paid = v_paid,
         status = v_status,
         paid_at = CASE WHEN v_status = 'paid' THEN COALESCE(paid_at, v_latest, now()) ELSE NULL END,
         updated_at = now()
   WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_invoice_payments_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_payment_totals();

-- 3. Backfill payment rows from existing paid invoices
INSERT INTO public.invoice_payments (invoice_id, amount, method, reference, stripe_payment_intent_id, paid_at)
SELECT i.id,
       CASE WHEN i.amount_paid > 0 THEN i.amount_paid ELSE i.total END,
       CASE WHEN i.stripe_payment_intent_id IS NOT NULL THEN 'stripe' ELSE 'other' END,
       i.stripe_payment_intent_id,
       i.stripe_payment_intent_id,
       COALESCE(i.paid_at, i.updated_at, i.created_at)
  FROM public.invoices i
 WHERE i.status = 'paid'
   AND COALESCE(i.total, 0) > 0
   AND NOT EXISTS (SELECT 1 FROM public.invoice_payments p WHERE p.invoice_id = i.id);

-- 4. Merge Shae Irons split: $400 (pi_3TYrw…) + $275 (pi_3TYrvR…) onto the $675 invoice,
--    then delete the orphan $0/$275 invoice that was only created because split-pay didn't exist.
DO $$
DECLARE
  v_keep uuid := '5881cbaf-67ba-4a8c-93ee-8538c126baf3';
  v_drop uuid := 'd7cf79fd-cd56-4cd3-96aa-c24397e1a311';
BEGIN
  -- Clear backfilled single payment on the kept invoice and replace with the two real charges
  DELETE FROM public.invoice_payments WHERE invoice_id = v_keep;

  INSERT INTO public.invoice_payments (invoice_id, amount, method, reference, stripe_payment_intent_id, paid_at, notes)
  VALUES
    (v_keep, 275, 'stripe', 'pi_3TYrvR5Q2VPXrjOx0Kh92ABz', 'pi_3TYrvR5Q2VPXrjOx0Kh92ABz', '2026-05-19 17:59:31.908+00', 'Split payment 1 of 2 (was duplicate invoice INV-1779210477742)'),
    (v_keep, 400, 'stripe', 'pi_3TYrw35Q2VPXrjOx0sAdmDin', 'pi_3TYrw35Q2VPXrjOx0sAdmDin', '2026-05-19 18:00:10.090+00', 'Split payment 2 of 2');

  -- Drop the duplicate invoice
  DELETE FROM public.invoice_payments WHERE invoice_id = v_drop;
  DELETE FROM public.invoices WHERE id = v_drop;
END $$;