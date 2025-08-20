-- Add employment_type field to nannies table for part-time/full-time selection
ALTER TABLE public.nannies 
ADD COLUMN employment_type text CHECK (employment_type IN ('part_time', 'full_time'));