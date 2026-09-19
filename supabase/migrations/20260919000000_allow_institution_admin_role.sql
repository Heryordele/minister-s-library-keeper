-- Update the RLS policy to allow institution_admin role for user_roles insert
DROP POLICY "Users choose own non-admin role" ON public.user_roles;

CREATE POLICY "Users choose own role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('minister','student','institution_admin'));
