-- Add RLS policy for admins to read all profiles (needed for admin dashboard)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_support_admin(auth.uid()));

-- Add RLS policy for admins to update all profiles (needed for credit management)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_support_admin(auth.uid()));