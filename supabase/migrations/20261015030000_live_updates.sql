-- Live updates across devices: send row changes for the user's own data to
-- open browsers. Realtime still applies each table's RLS policies, so a user
-- only receives changes to rows they can already read.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'books',
    'borrow_records',
    'reading_goals',
    'reading_progress',
    'reading_streaks',
    'notifications'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END
$$;
