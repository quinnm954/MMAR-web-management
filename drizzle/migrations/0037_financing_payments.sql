ALTER TABLE public.financing_contracts
  ADD COLUMN IF NOT EXISTS invoice_id uuid,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
  ADD COLUMN IF NOT EXISTS bank_last4 text;

CREATE TABLE public.financing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.financing_contracts(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  seq integer NOT NULL,
  label text NOT NULL DEFAULT 'Weekly draft',
  due_date date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  stripe_payment_intent_id text,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id, seq)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financing_payments TO authenticated;
GRANT ALL ON public.financing_payments TO service_role;
ALTER TABLE public.financing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage financing payments" ON public.financing_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Customers view own financing payments" ON public.financing_payments FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
CREATE TRIGGER financing_payments_updated BEFORE UPDATE ON public.financing_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();