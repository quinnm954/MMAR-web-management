CREATE OR REPLACE FUNCTION public.is_oil_change_request(_text text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public
AS $$ SELECT coalesce(_text, '') ~* '\m(oil[[:space:]-]*(and[[:space:]]+filter[[:space:]]+)?change|change[[:space:]]+(the[[:space:]]+)?oil|cambio[[:space:]]+de[[:space:]]+aceite)\M' $$;
GRANT EXECUTE ON FUNCTION public.is_oil_change_request(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.oil_change_eligible(_phone text DEFAULT '', _customer_id uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.memberships m JOIN public.profiles p ON p.id = m.customer_id
  WHERE m.status = 'active' AND m.cancelled_at IS NULL
    AND (m.start_date IS NULL OR m.start_date <= (now() AT TIME ZONE 'America/New_York')::date)
    AND (m.current_period_end IS NULL OR m.current_period_end > now())
    AND ((_customer_id IS NOT NULL AND m.customer_id = _customer_id)
      OR (length(regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g')) >= 10
        AND right(regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'), 10) = right(regexp_replace(_phone, '[^0-9]', '', 'g'), 10)))
 )
$$;
REVOKE ALL ON FUNCTION public.oil_change_eligible(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.oil_change_eligible(text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_oil_change_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
 IF public.is_oil_change_request(concat_ws(' ', NEW.service_type, NEW.description, NEW.notes))
    AND NOT public.oil_change_eligible(NEW.customer_phone, NULL) THEN
  IF NEW.converted_appointment_id IS NOT NULL OR NEW.status IN ('confirmed', 'converted', 'approved', 'scheduled') THEN
   RAISE EXCEPTION 'Oil changes are only available to active MMAR Care subscribers. Verify the subscription before approving.';
  END IF;
  NEW.requested_date := NULL;
  NEW.requested_time_window := NULL;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_oil_change_booking() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_oil_change_booking BEFORE INSERT OR UPDATE OF service_type, description, notes, status, converted_appointment_id, requested_date, requested_time_window ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.guard_oil_change_booking();

CREATE OR REPLACE FUNCTION public.guard_oil_change_appointment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
 IF NEW.status NOT IN ('cancelled', 'canceled', 'declined')
    AND public.is_oil_change_request(concat_ws(' ', NEW.service_type, NEW.description))
    AND NOT public.oil_change_eligible('', NEW.customer_id) THEN
  RAISE EXCEPTION 'Oil changes are only available to active MMAR Care subscribers. Verify the subscription before scheduling.';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_oil_change_appointment() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER enforce_oil_change_appointment BEFORE INSERT OR UPDATE OF service_type, description, customer_id, scheduled_at ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.guard_oil_change_appointment();