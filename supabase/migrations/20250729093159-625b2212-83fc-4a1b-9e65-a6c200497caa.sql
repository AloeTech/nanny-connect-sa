-- Fix nanny profile visibility RLS policy
DROP POLICY IF EXISTS "Clients can view approved nanny profiles" ON public.nannies;

CREATE POLICY "Clients can view approved nanny profiles" 
ON public.nannies 
FOR SELECT 
USING (
  profile_approved = true AND 
  (
    has_role(auth.uid(), 'client'::user_role) OR 
    has_role(auth.uid(), 'admin'::user_role) OR
    auth.uid() IS NULL  -- Allow anonymous viewing of approved profiles
  )
);