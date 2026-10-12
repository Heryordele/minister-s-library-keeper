-- Institution admin accounts now require approval.
-- Users can no longer give themselves the institution_admin role; choosing
-- "Institution" files a request that the project owner approves from the
-- Supabase SQL editor:
--   SELECT public.approve_institution_request('<user id>');
--   SELECT public.reject_institution_request('<user id>');

-- 1. Users may only self-assign the personal roles.
DROP POLICY IF EXISTS "Users choose own role" ON public.user_roles;
CREATE POLICY "Users choose own non-admin role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('minister', 'student'));

-- 2. Pending institution admin requests (one per user).
CREATE TABLE public.institution_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

GRANT SELECT, INSERT ON public.institution_requests TO authenticated;
GRANT ALL ON public.institution_requests TO service_role;
ALTER TABLE public.institution_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own institution request" ON public.institution_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users file own institution request" ON public.institution_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 3. Owner-only review functions (not callable from the app).
CREATE OR REPLACE FUNCTION public.approve_institution_request(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.institution_requests
  SET status = 'approved', reviewed_at = now()
  WHERE user_id = _user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No institution request for user %', _user_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'institution_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_institution_request(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.institution_requests
  SET status = 'rejected', reviewed_at = now()
  WHERE user_id = _user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No institution request for user %', _user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_institution_request(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_institution_request(UUID) FROM PUBLIC, anon, authenticated;
