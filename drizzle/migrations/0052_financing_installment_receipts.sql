ALTER TABLE public.financing_payments ADD COLUMN IF NOT EXISTS stripe_invoice_id text;
CREATE UNIQUE INDEX IF NOT EXISTS financing_payments_stripe_invoice_unique ON public.financing_payments(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_financing_payment_to_invoice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.financing_contracts%ROWTYPE; inv public.invoices%ROWTYPE; receipt_amount numeric; remaining numeric; ref text; schedule_total numeric;
BEGIN
 IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
 SELECT * INTO c FROM public.financing_contracts WHERE id=NEW.contract_id FOR UPDATE;
 IF c.invoice_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO inv FROM public.invoices WHERE id=c.invoice_id FOR UPDATE;
 ref := 'financing:' || NEW.id::text;
 IF EXISTS(SELECT 1 FROM public.invoice_payments WHERE invoice_id=inv.id AND reference=ref) THEN RETURN NEW; END IF;
 SELECT greatest(inv.total-coalesce(sum(amount),0),0) INTO remaining FROM public.invoice_payments WHERE invoice_id=inv.id;
 SELECT sum(amount) INTO schedule_total FROM public.financing_payments WHERE contract_id=c.id AND seq>0;
 receipt_amount := CASE WHEN NEW.seq=0 THEN NEW.amount ELSE round(NEW.amount * c.principal / nullif(schedule_total,0),2) END;
 IF NOT EXISTS(SELECT 1 FROM public.financing_payments WHERE contract_id=c.id AND status<>'paid') THEN receipt_amount:=remaining; END IF;
 receipt_amount:=least(coalesce(receipt_amount,0),remaining);
 IF receipt_amount>0 THEN
  INSERT INTO public.invoice_payments(invoice_id,amount,method,reference,notes,paid_at,stripe_payment_intent_id)
  VALUES(inv.id,receipt_amount,'card',ref,coalesce(NEW.label,'Financing payment') || ' - financing; collected $' || NEW.amount::text || '; interest $' || (NEW.amount-receipt_amount)::text,coalesce(NEW.paid_at,now()),NEW.stripe_payment_intent_id);
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.record_financing_stripe_invoice(_contract_id uuid,_stripe_invoice_id text,_due_date date,_down_payment boolean,_amount numeric,_paid_at timestamptz,_payment_intent_id text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.financing_contracts%ROWTYPE; p public.financing_payments%ROWTYPE;
BEGIN
 IF _stripe_invoice_id IS NULL OR _stripe_invoice_id !~ '^in_[A-Za-z0-9]+$' OR _amount<=0 OR _paid_at IS NULL OR _due_date IS NULL THEN RAISE EXCEPTION 'Invalid Stripe receipt'; END IF;
 SELECT * INTO c FROM public.financing_contracts WHERE id=_contract_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
 SELECT * INTO p FROM public.financing_payments WHERE stripe_invoice_id=_stripe_invoice_id;
 IF FOUND THEN
  IF p.contract_id<>c.id THEN RAISE EXCEPTION 'Receipt belongs to another contract'; END IF;
  RETURN p.id;
 END IF;
 SELECT * INTO p FROM public.financing_payments WHERE contract_id=c.id AND ((_down_payment AND seq=0) OR (NOT _down_payment AND seq>0 AND due_date=_due_date)) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No matching installment for %',_due_date; END IF;
 IF abs(p.amount-_amount)>0.005 THEN RAISE EXCEPTION 'Collected amount does not match scheduled installment'; END IF;
 IF p.status='paid' AND p.stripe_invoice_id IS NOT NULL THEN RAISE EXCEPTION 'Installment already has another receipt'; END IF;
 UPDATE public.financing_payments SET status='paid',paid_at=coalesce(p.paid_at,_paid_at),stripe_invoice_id=_stripe_invoice_id,stripe_payment_intent_id=coalesce(_payment_intent_id,p.stripe_payment_intent_id),failure_reason=NULL WHERE id=p.id;
 RETURN p.id;
END $$;
REVOKE ALL ON FUNCTION public.record_financing_stripe_invoice(uuid,text,date,boolean,numeric,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_financing_stripe_invoice(uuid,text,date,boolean,numeric,timestamptz,text) TO service_role;

CREATE OR REPLACE FUNCTION public.recalc_invoice_payment_totals() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_invoice_id uuid:=coalesce(NEW.invoice_id,OLD.invoice_id); v_total numeric; v_paid numeric; v_latest timestamptz; v_status text; v_current_status text; v_pending boolean;
BEGIN
 SELECT total,status INTO v_total,v_current_status FROM public.invoices WHERE id=v_invoice_id FOR UPDATE;
 IF v_total IS NULL THEN RETURN coalesce(NEW,OLD); END IF;
 SELECT coalesce(sum(amount),0),max(paid_at) INTO v_paid,v_latest FROM public.invoice_payments WHERE invoice_id=v_invoice_id;
 SELECT EXISTS(SELECT 1 FROM public.financing_contracts c JOIN public.financing_payments p ON p.contract_id=c.id WHERE c.invoice_id=v_invoice_id AND c.status<>'cancelled' AND p.status<>'paid') INTO v_pending;
 v_status:=CASE WHEN v_current_status IN ('void','refunded') THEN v_current_status WHEN v_paid<=0 THEN 'unpaid' WHEN v_paid+0.005<v_total OR v_pending THEN 'partial' ELSE 'paid' END;
 UPDATE public.invoices SET amount_paid=v_paid,status=v_status,paid_at=CASE WHEN v_status='paid' THEN coalesce(paid_at,v_latest,now()) ELSE NULL END,updated_at=now() WHERE id=v_invoice_id;
 RETURN coalesce(NEW,OLD);
END $$;