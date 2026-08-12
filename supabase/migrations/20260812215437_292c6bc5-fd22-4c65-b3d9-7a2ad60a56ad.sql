GRANT INSERT ON public.user_roles TO authenticated;
CREATE POLICY "Users choose own non-admin role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('minister','student'));