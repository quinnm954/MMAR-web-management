-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create a table for financing contracts
CREATE TABLE public.financing_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Client Information
  client_name TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_contact TEXT NOT NULL,
  
  -- Service Details
  agreement_date DATE NOT NULL,
  vehicle_info TEXT,
  service_description TEXT,
  total_service_price NUMERIC(10,2) NOT NULL,
  first_payment_date DATE NOT NULL,
  
  -- Calculated Values (stored for record-keeping)
  down_payment NUMERIC(10,2) NOT NULL,
  principal NUMERIC(10,2) NOT NULL,
  interest NUMERIC(10,2) NOT NULL,
  total_financed NUMERIC(10,2) NOT NULL,
  monthly_payment NUMERIC(10,2) NOT NULL,
  
  -- Signature URLs (stored in storage, not base64)
  client_signature_url TEXT,
  client_signed_at TIMESTAMP WITH TIME ZONE,
  provider_signature_url TEXT,
  provider_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Initials (small text values, not images)
  initial_terms TEXT,
  initial_security_interest TEXT,
  initial_default_consequences TEXT,
  initial_info_accuracy TEXT,
  initial_received_copy TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.financing_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all financing contracts" 
ON public.financing_contracts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update financing contracts" 
ON public.financing_contracts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete financing contracts" 
ON public.financing_contracts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow anyone to insert (public-facing form)
CREATE POLICY "Anyone can insert financing contracts" 
ON public.financing_contracts 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financing_contracts_updated_at
BEFORE UPDATE ON public.financing_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);

-- Create storage policies for signature uploads
CREATE POLICY "Signatures are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'signatures');

CREATE POLICY "Anyone can upload signatures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Admins can delete signatures" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'signatures' AND has_role(auth.uid(), 'admin'::app_role));