CREATE TABLE public.review_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments text,
  name text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','resolved')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.review_feedback TO authenticated;
GRANT ALL ON public.review_feedback TO service_role;
ALTER TABLE public.review_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read feedback" ON public.review_feedback FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update feedback" ON public.review_feedback FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete feedback" ON public.review_feedback FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER review_feedback_updated BEFORE UPDATE ON public.review_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.submit_review_feedback(_rating int, _comments text, _name text, _phone text, _email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF _rating IS NULL OR _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  INSERT INTO public.review_feedback(rating, comments, name, phone, email)
  VALUES (_rating, left(nullif(trim(_comments),''),2000), left(nullif(trim(_name),''),100), left(nullif(trim(_phone),''),30), left(nullif(trim(_email),''),255))
  RETURNING id INTO _id;
  BEGIN
    PERFORM public._send_push_to_staff(
      _rating || '-star customer feedback',
      coalesce(left(_comments,120), 'A customer left private feedback.'),
      'customer', '/admin?tab=feedback');
  EXCEPTION WHEN others THEN NULL; END;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.submit_review_feedback(int,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_review_feedback(int,text,text,text,text) TO anon, authenticated;