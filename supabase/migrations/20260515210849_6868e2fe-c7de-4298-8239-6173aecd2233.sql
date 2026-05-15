
-- 1. Mileage history
CREATE TABLE public.vehicle_mileage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  mileage integer NOT NULL CHECK (mileage >= 0 AND mileage < 2000000),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','service','quick_prompt','email_reply','sms_reply','admin','token_link')),
  notes text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vmlogs_vehicle ON public.vehicle_mileage_logs(vehicle_id, recorded_at DESC);
CREATE INDEX idx_vmlogs_customer ON public.vehicle_mileage_logs(customer_id, recorded_at DESC);

ALTER TABLE public.vehicle_mileage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own mileage logs" ON public.vehicle_mileage_logs
  FOR SELECT USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Customers insert own mileage logs" ON public.vehicle_mileage_logs
  FOR INSERT WITH CHECK (customer_id = auth.uid() OR public.is_staff(auth.uid()) OR auth.role() = 'service_role');
CREATE POLICY "Staff manage mileage logs" ON public.vehicle_mileage_logs
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 2. Vehicles: derived columns
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS avg_miles_per_day numeric,
  ADD COLUMN IF NOT EXISTS last_mileage_update_at timestamptz;

-- 3. Sync trigger: keep vehicles.current_mileage + avg_miles_per_day fresh
CREATE OR REPLACE FUNCTION public.sync_vehicle_mileage_from_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max integer;
  v_first_at timestamptz;
  v_first_miles integer;
  v_days numeric;
  v_avg numeric;
BEGIN
  SELECT MAX(mileage) INTO v_max FROM public.vehicle_mileage_logs WHERE vehicle_id = NEW.vehicle_id;

  -- Avg miles/day from oldest reading in last 365 days
  SELECT recorded_at, mileage
    INTO v_first_at, v_first_miles
    FROM public.vehicle_mileage_logs
    WHERE vehicle_id = NEW.vehicle_id
      AND recorded_at >= now() - INTERVAL '365 days'
    ORDER BY recorded_at ASC
    LIMIT 1;

  IF v_first_at IS NOT NULL AND v_first_at < NEW.recorded_at THEN
    v_days := GREATEST(EXTRACT(EPOCH FROM (NEW.recorded_at - v_first_at)) / 86400.0, 1);
    v_avg := GREATEST((v_max - v_first_miles)::numeric / v_days, 0);
  END IF;

  UPDATE public.vehicles
    SET current_mileage = GREATEST(COALESCE(current_mileage, 0), COALESCE(v_max, 0)),
        avg_miles_per_day = COALESCE(v_avg, avg_miles_per_day),
        last_mileage_update_at = NEW.recorded_at,
        updated_at = now()
    WHERE id = NEW.vehicle_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_vehicle_mileage
AFTER INSERT ON public.vehicle_mileage_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_mileage_from_log();

-- 4. Auto-log mileage when a service_record is inserted with mileage
CREATE OR REPLACE FUNCTION public.log_mileage_from_service_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mileage_at_service IS NOT NULL AND NEW.mileage_at_service > 0 THEN
    INSERT INTO public.vehicle_mileage_logs (vehicle_id, customer_id, mileage, source, notes, recorded_at)
    VALUES (
      NEW.vehicle_id,
      NEW.customer_id,
      NEW.mileage_at_service,
      'service',
      'Auto-logged from service: ' || NEW.service_type,
      COALESCE(NEW.service_date::timestamptz, now())
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_mileage_from_service
AFTER INSERT ON public.service_records
FOR EACH ROW EXECUTE FUNCTION public.log_mileage_from_service_record();

-- 5. One-click mileage update tokens (for email/SMS magic links)
CREATE TABLE public.mileage_update_tokens (
  token text PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms')),
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mileage_tokens_customer ON public.mileage_update_tokens(customer_id, created_at DESC);

ALTER TABLE public.mileage_update_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages mileage tokens" ON public.mileage_update_tokens
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Staff view mileage tokens" ON public.mileage_update_tokens
  FOR SELECT USING (public.is_staff(auth.uid()));

-- 6. RPC for public token redemption (used by edge function with anon)
CREATE OR REPLACE FUNCTION public.redeem_mileage_token(_token text, _miles integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tok public.mileage_update_tokens;
BEGIN
  IF _miles IS NULL OR _miles <= 0 OR _miles >= 2000000 THEN
    RAISE EXCEPTION 'Invalid mileage';
  END IF;
  SELECT * INTO v_tok FROM public.mileage_update_tokens WHERE token = _token LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Token not found'; END IF;
  IF v_tok.used_at IS NOT NULL THEN RAISE EXCEPTION 'Token already used'; END IF;
  IF v_tok.expires_at < now() THEN RAISE EXCEPTION 'Token expired'; END IF;

  INSERT INTO public.vehicle_mileage_logs (vehicle_id, customer_id, mileage, source, notes)
  VALUES (v_tok.vehicle_id, v_tok.customer_id, _miles,
    CASE v_tok.channel WHEN 'sms' THEN 'sms_reply' ELSE 'token_link' END,
    'Submitted via ' || v_tok.channel || ' link');

  UPDATE public.mileage_update_tokens SET used_at = now() WHERE token = _token;

  RETURN jsonb_build_object('ok', true, 'vehicle_id', v_tok.vehicle_id, 'mileage', _miles);
END;
$$;
