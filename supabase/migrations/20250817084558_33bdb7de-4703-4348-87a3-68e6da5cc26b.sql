-- Add new fields to nannies table
ALTER TABLE public.nannies ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.nannies ADD COLUMN IF NOT EXISTS accommodation_preference text CHECK (accommodation_preference IN ('live_in', 'live_out'));
ALTER TABLE public.nannies ADD COLUMN IF NOT EXISTS proof_of_residence_url text;

-- Add new fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS town text;

-- Create new storage bucket for proof of residence documents
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-of-residence', 'proof-of-residence', false) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for proof of residence
CREATE POLICY "Users can view their own proof of residence documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'proof-of-residence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own proof of residence documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'proof-of-residence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own proof of residence documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'proof-of-residence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all proof of residence documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'proof-of-residence' AND has_role(auth.uid(), 'admin'::user_role));

-- Update payments table default amount to R200
ALTER TABLE public.payments ALTER COLUMN amount SET DEFAULT 200.00;