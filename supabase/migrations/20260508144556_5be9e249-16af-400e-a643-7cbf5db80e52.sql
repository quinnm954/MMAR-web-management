ALTER TABLE public.financing_contracts
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS estimate_id uuid;

CREATE INDEX IF NOT EXISTS idx_financing_contracts_customer ON public.financing_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_financing_contracts_estimate ON public.financing_contracts(estimate_id);

DROP POLICY IF EXISTS "Customers view own financing contracts" ON public.financing_contracts;
CREATE POLICY "Customers view own financing contracts"
ON public.financing_contracts FOR SELECT
USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Customers insert own financing contracts" ON public.financing_contracts;
CREATE POLICY "Customers insert own financing contracts"
ON public.financing_contracts FOR INSERT
WITH CHECK (customer_id = auth.uid() OR auth.role() = 'service_role');