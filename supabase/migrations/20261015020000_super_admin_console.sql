-- Super admin console: an activity log, dashboard counts, and a school detail
-- view. Everything is read through functions that check is_super_admin(), and
-- borrower names and contact details are never returned, only counts.

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No direct access for app users; written and read by the functions below.
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_current_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;

-- Approve and reject now also write to the activity log.
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
  INSERT INTO public.admin_activity_log (actor_email, action, target_user_id)
  VALUES (public.admin_current_email(), 'Approved institution request', _user_id);
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
  INSERT INTO public.admin_activity_log (actor_email, action, target_user_id)
  VALUES (public.admin_current_email(), 'Rejected institution request', _user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  RETURN json_build_object(
    'pending', (SELECT count(*) FROM public.institution_requests WHERE status = 'pending'),
    'approved', (SELECT count(*) FROM public.institution_requests WHERE status = 'approved'),
    'rejected', (SELECT count(*) FROM public.institution_requests WHERE status = 'rejected'),
    'users', (SELECT count(*) FROM public.profiles),
    'books', (SELECT count(*) FROM public.books),
    'out_on_loan', (SELECT count(*) FROM public.borrow_records WHERE status = 'borrowed'),
    'overdue', (
      SELECT count(*) FROM public.borrow_records
      WHERE status = 'borrowed' AND expected_return_date < current_date
    )
  );
END;
$$;

-- One school: its account and request details, and counts for its library.
CREATE OR REPLACE FUNCTION public.admin_school_detail(_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  RETURN json_build_object(
    'account_email', (SELECT email FROM public.profiles WHERE id = _user_id),
    'organization_name', (SELECT organization_name FROM public.profiles WHERE id = _user_id),
    'library_name', (SELECT library_name FROM public.profiles WHERE id = _user_id),
    'administrator_email', (SELECT admin_email FROM public.profiles WHERE id = _user_id),
    'joined', (SELECT created_at FROM public.profiles WHERE id = _user_id),
    'request_status', (SELECT status FROM public.institution_requests WHERE user_id = _user_id),
    'requested', (SELECT created_at FROM public.institution_requests WHERE user_id = _user_id),
    'reviewed', (SELECT reviewed_at FROM public.institution_requests WHERE user_id = _user_id),
    'books', (SELECT count(*) FROM public.books WHERE owner_id = _user_id),
    'books_added_30_days', (
      SELECT count(*) FROM public.books
      WHERE owner_id = _user_id AND created_at > now() - interval '30 days'
    ),
    'out_on_loan', (
      SELECT count(*) FROM public.borrow_records
      WHERE owner_id = _user_id AND status = 'borrowed'
    ),
    'overdue', (
      SELECT count(*) FROM public.borrow_records
      WHERE owner_id = _user_id AND status = 'borrowed' AND expected_return_date < current_date
    ),
    'returned', (
      SELECT count(*) FROM public.borrow_records
      WHERE owner_id = _user_id AND status = 'returned'
    ),
    'lost', (
      SELECT count(*) FROM public.borrow_records
      WHERE owner_id = _user_id AND status = 'lost'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_recent_activity(_limit INT DEFAULT 50)
RETURNS TABLE (
  created_at TIMESTAMPTZ,
  actor_email TEXT,
  action TEXT,
  target_user_id UUID,
  target_organization TEXT,
  details TEXT
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
  SELECT l.created_at, l.actor_email, l.action, l.target_user_id,
         p.organization_name, l.details
  FROM public.admin_activity_log l
  LEFT JOIN public.profiles p ON p.id = l.target_user_id
  ORDER BY l.created_at DESC
  LIMIT greatest(1, least(_limit, 200));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_current_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_school_detail(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_recent_activity(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_school_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_recent_activity(INT) TO authenticated;
