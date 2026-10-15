-- Super admin user management: list accounts, and suspend or restore them.
-- Both functions check is_super_admin() first. A suspended account is also
-- blocked from signing in by the server function that sets the sign-in ban.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.admin_list_users(_search TEXT DEFAULT NULL, _limit INT DEFAULT 200)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  organization_name TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  book_count BIGINT
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
  SELECT
    u.id,
    u.email::TEXT,
    p.name,
    p.organization_name,
    p.plan::TEXT,
    u.created_at,
    u.last_sign_in_at,
    p.suspended_at,
    (SELECT count(*) FROM public.books b WHERE b.owner_id = u.id)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE _search IS NULL OR _search = ''
     OR u.email ILIKE '%' || _search || '%'
     OR p.name ILIKE '%' || _search || '%'
     OR p.organization_name ILIKE '%' || _search || '%'
  ORDER BY u.created_at DESC
  LIMIT greatest(1, least(_limit, 500));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_suspended(_user_id UUID, _suspended BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Super admin access required';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot suspend your own account';
  END IF;
  UPDATE public.profiles
  SET suspended_at = CASE WHEN _suspended THEN now() ELSE NULL END
  WHERE id = _user_id;
  INSERT INTO public.admin_activity_log (actor_email, action, target_user_id)
  VALUES (
    public.admin_current_email(),
    CASE WHEN _suspended THEN 'Suspended account' ELSE 'Restored account' END,
    _user_id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(TEXT, INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_suspended(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_suspended(UUID, BOOLEAN) TO authenticated;
