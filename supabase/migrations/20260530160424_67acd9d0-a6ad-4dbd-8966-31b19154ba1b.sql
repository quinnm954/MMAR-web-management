CREATE TABLE public.membership_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  customer_id uuid,
  kind text NOT NULL CHECK (kind IN ('deposit','subscription','other')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','refunded','failed')),
  stripe_invoice_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_fee numeric,
  stripe_fee_synced_at timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz NOT NULL DEFAULT now(),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_payments TO authenticated;
GRANT ALL ON public.membership_payments TO service_role;

ALTER TABLE public.membership_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own membership payments"
ON public.membership_payments FOR SELECT TO authenticated
USING (customer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage membership payments"
ON public.membership_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_membership_payments_membership ON public.membership_payments(membership_id);
CREATE INDEX idx_membership_payments_paid_at ON public.membership_payments(paid_at DESC);

CREATE TRIGGER update_membership_payments_updated_at
BEFORE UPDATE ON public.membership_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();