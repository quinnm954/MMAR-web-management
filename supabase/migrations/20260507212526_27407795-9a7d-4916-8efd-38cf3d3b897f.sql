
-- Add customer role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- Membership plans (public catalog)
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  monthly_price numeric NOT NULL,
  deposit_amount numeric NOT NULL,
  total_at_signup numeric NOT NULL,
  badge text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  included_oil_quarts integer,
  included_oil_changes_yearly integer,
  labor_discount_pct integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly viewable" ON public.membership_plans FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage plans" ON public.membership_plans FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  vin text,
  year integer,
  make text,
  model text,
  engine text,
  trim text,
  license_plate text,
  color text,
  current_mileage integer,
  oil_capacity_qts numeric,
  oil_viscosity text,
  oil_filter_part text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicles_owner ON public.vehicles(owner_id);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own vehicles" ON public.vehicles FOR SELECT USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers insert own vehicles" ON public.vehicles FOR INSERT WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers update own vehicles" ON public.vehicles FOR UPDATE USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete vehicles" ON public.vehicles FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACH authorizations (no account numbers, just signed authorization)
CREATE TABLE public.ach_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  account_holder_name text NOT NULL,
  bank_name text,
  routing_last4 text,
  account_last4 text,
  authorized_amount numeric,
  authorization_text text NOT NULL,
  signature_image text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  status text NOT NULL DEFAULT 'active',
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ach_customer ON public.ach_authorizations(customer_id);
ALTER TABLE public.ach_authorizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own ACH" ON public.ach_authorizations FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers insert own ACH" ON public.ach_authorizations FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins manage ACH" ON public.ach_authorizations FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete ACH" ON public.ach_authorizations FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Memberships
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
  ach_authorization_id uuid REFERENCES public.ach_authorizations(id),
  status text NOT NULL DEFAULT 'pending',
  start_date date,
  next_billing_date date,
  deposit_paid boolean NOT NULL DEFAULT false,
  deposit_paid_at timestamptz,
  oil_changes_used integer NOT NULL DEFAULT 0,
  agreement_pdf_url text,
  agreement_signed_at timestamptz,
  signature_image text,
  ip_address text,
  user_agent text,
  cancellation_requested_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_memberships_customer ON public.memberships(customer_id);
CREATE INDEX idx_memberships_vehicle ON public.memberships(vehicle_id);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own memberships" ON public.memberships FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create own memberships" ON public.memberships FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers update own memberships limited" ON public.memberships FOR UPDATE USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete memberships" ON public.memberships FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_memberships_updated BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  description text,
  requested_date date,
  requested_time_window text,
  scheduled_at timestamptz,
  service_address text,
  status text NOT NULL DEFAULT 'requested',
  technician_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appts_customer ON public.appointments(customer_id);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own appts" ON public.appointments FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Customers create appts" ON public.appointments FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers update own appts" ON public.appointments FOR UPDATE USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete appts" ON public.appointments FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_appts_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service records (completed work)
CREATE TABLE public.service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  service_date date NOT NULL,
  mileage_at_service integer,
  service_type text NOT NULL,
  parts_used jsonb DEFAULT '[]'::jsonb,
  labor_performed text,
  technician_notes text,
  photo_urls jsonb DEFAULT '[]'::jsonb,
  invoice_total numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_service_vehicle ON public.service_records(vehicle_id);
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own service" ON public.service_records FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage service" ON public.service_records FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_service_updated BEFORE UPDATE ON public.service_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service recommendations / future repairs
CREATE TABLE public.service_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  service_record_id uuid REFERENCES public.service_records(id) ON DELETE SET NULL,
  recommendation text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  estimated_cost numeric,
  status text NOT NULL DEFAULT 'pending',
  due_mileage integer,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_recs_vehicle ON public.service_recommendations(vehicle_id);
ALTER TABLE public.service_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own recs" ON public.service_recommendations FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage recs" ON public.service_recommendations FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_recs_updated BEFORE UPDATE ON public.service_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  service_record_id uuid REFERENCES public.service_records(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  invoice_number text UNIQUE,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'unpaid',
  due_date date,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own invoices" ON public.invoices FOR SELECT USING (customer_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign 'customer' role on new signups + create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed the 3 MMAR plans
INSERT INTO public.membership_plans (slug, name, tagline, monthly_price, deposit_amount, total_at_signup, badge, included_oil_quarts, included_oil_changes_yearly, labor_discount_pct, sort_order, features) VALUES
('essential', 'Essential Synthetic Care', 'Reliable mobile maintenance for everyday drivers', 19.99, 59.97, 79.96, NULL, 5, 3, 0, 1,
 '["3 synthetic oil changes yearly", "Up to 5 quarts included", "Standard oil filter included", "Multi-point inspection", "Tire pressure checks", "Fluid top-offs", "Battery & charging system testing", "Priority scheduling", "1 basic exterior wash yearly"]'::jsonb),
('full-care', 'Full Vehicle Care', 'Our most popular complete care plan', 39.99, 119.97, 159.96, 'Best Value', 6, 4, 10, 2,
 '["4 synthetic oil changes yearly", "Up to 6 quarts included", "Standard oil filter included", "Brake inspections", "Tire rotations when possible", "1 diagnostic scan yearly", "Priority scheduling", "10% labor discount", "2 basic exterior washes yearly", "1 basic interior vacuum yearly"]'::jsonb),
('premium', 'Premium Protection', 'Full premium coverage with after-hours priority', 69.99, 209.97, 279.96, NULL, 7, 4, 15, 3,
 '["4 premium synthetic oil changes yearly", "Up to 7 quarts included", "Premium oil filter included", "Cabin air filter yearly", "Wiper blades yearly", "2 diagnostic scans yearly", "Priority emergency scheduling", "15% labor discount", "Preferred after-hours pricing", "Monthly basic exterior wash eligibility", "2 basic interior vacuum services yearly"]'::jsonb);
