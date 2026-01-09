-- Create warranty_acknowledgments table
CREATE TABLE public.warranty_acknowledgments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  vin_last6 TEXT,
  work_order_number TEXT,
  signature_image TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.warranty_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (customer-facing, no auth required)
CREATE POLICY "Anyone can insert warranty acknowledgments"
ON public.warranty_acknowledgments
FOR INSERT
WITH CHECK (true);

-- Only service role can read (for admin purposes later)
CREATE POLICY "Service role can read all acknowledgments"
ON public.warranty_acknowledgments
FOR SELECT
TO service_role
USING (true);