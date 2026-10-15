-- Super admins review institution requests from inside the app, instead of
-- running approve_institution_request(...) in the Supabase SQL editor.
--
-- Super admin = a confirmed account whose email is on the list below. Using
-- the list (rather than a role row) means the owner accounts count as soon as
-- they sign in, with no separate grant step. Email confirmation is required,
-- so an unconfirmed account can't claim one of these addresses.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
      AND lower(u.email) IN ('ayodelee564@gmail.com', 'jerryadeyemi20@gmail.com')
  );
$$;

-- Requests for the review screen, pending first, with what the school entered.
CREATE OR REPLACE FUNCTION public.admin_list_institution_requests()
RETURNS TABLE (
  user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  account_email TEXT,
  organization_name TEXT,
  library_name TEXT,
  admin_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;

  RETURN QUERY
  SELECT r.user_id, r.status, r.created_at, p.email, p.organization_name,
         p.library_name, p.admin_email
  FROM public.institution_requests r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  ORDER BY (r.status = 'pending') DESC, r.created_at DESC;
END;
$$;

-- The existing approve/reject functions stay owner-only. These wrappers are
-- the only route the app has, and they check the caller first.
CREATE OR REPLACE FUNCTION public.admin_approve_institution_request(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  PERFORM public.approve_institution_request(_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_institution_request(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  -- Only a pending request can be rejected; rejecting an approved school
  -- would leave its admin role in place with a "rejected" status.
  IF EXISTS (
    SELECT 1 FROM public.institution_requests
    WHERE user_id = _user_id AND status <> 'pending'
  ) THEN
    RAISE EXCEPTION 'Only pending requests can be rejected';
  END IF;
  PERFORM public.reject_institution_request(_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_institution_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_institution_request(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_institution_request(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_institution_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_institution_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_institution_request(UUID) TO authenticated;
