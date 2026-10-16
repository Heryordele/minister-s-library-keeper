-- Super admin role management. Super admins can see each user's role, filter
-- by role, and set a user to minister or student. Institution admin is not
-- assignable here: it is granted only when a school's request is approved.

-- Role is part of the list, so the old version has to be dropped first.
DROP FUNCTION IF EXISTS public.admin_list_users(TEXT, INT);

CREATE OR REPLACE FUNCTION public.admin_list_users(
  _search TEXT DEFAULT NULL,
  _limit INT DEFAULT 200,
  _role TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  organization_name TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  book_count BIGINT,
  role TEXT
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
    (SELECT count(*) FROM public.books b WHERE b.owner_id = u.id),
    (SELECT ur.role::TEXT FROM public.user_roles ur
      WHERE ur.user_id = u.id ORDER BY ur.created_at DESC LIMIT 1)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE (_search IS NULL OR _search = ''
         OR u.email ILIKE '%' || _search || '%'
         OR p.name ILIKE '%' || _search || '%'
         OR p.organization_name ILIKE '%' || _search || '%')
    AND (_role IS NULL OR _role = ''
         OR (_role = 'none' AND NOT EXISTS (
              SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id))
         OR (_role <> 'none' AND EXISTS (
              SELECT 1 FROM public.user_roles ur
              WHERE ur.user_id = u.id AND ur.role::TEXT = _role
                AND ur.created_at = (
                  SELECT max(x.created_at) FROM public.user_roles x WHERE x.user_id = u.id))))
  ORDER BY u.created_at DESC
  LIMIT greatest(1, least(_limit, 500));
END;
$$;

-- Sets a user to minister or student, replacing their current one. Refuses
-- your own account and any institution account.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id UUID, _role TEXT)
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
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;
  IF _role NOT IN ('minister', 'student') THEN
    RAISE EXCEPTION 'Only the minister or student role can be set here';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'institution_admin'
  ) THEN
    RAISE EXCEPTION 'Institution accounts are managed through approval';
  END IF;
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role IN ('minister', 'student');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role::public.app_role);
  INSERT INTO public.admin_activity_log (actor_email, action, target_user_id)
  VALUES (public.admin_current_email(), 'Changed role to ' || _role, _user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(TEXT, INT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
