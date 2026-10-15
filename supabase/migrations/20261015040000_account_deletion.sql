-- Account deletion and the 90-day holding area for cleared lending records.
--
-- cleared_at: when a returned or lost record was cleared. Cleared records are
-- hidden from the lending list and can be restored until the purge below.
-- last_exported_at: when the user last downloaded their data. Institution
-- accounts can delete their account once they have exported.

ALTER TABLE public.borrow_records ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_exported_at TIMESTAMPTZ;

-- Permanently remove cleared records 90 days after they were cleared.
-- cron.schedule() upserts by job name, so re-running this migration is safe.
SELECT cron.schedule(
  'purge-cleared-lending-records',
  '30 3 * * *',
  $$ DELETE FROM public.borrow_records
     WHERE cleared_at IS NOT NULL AND cleared_at < now() - interval '90 days' $$
);
