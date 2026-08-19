-- Schedules the daily reminders sweep (lending due/overdue + habit-accountability
-- nudges) against the deployed app's webhook. pg_cron and pg_net were already
-- enabled in a prior migration but nothing was ever scheduled, so this endpoint
-- has never actually run on its own — it only fired when a user had the app
-- open (via the client-side generateNotifications() call), defeating the
-- purpose of a re-engagement nudge for users who've gone quiet.
--
-- cron.schedule() upserts by job name, so re-running this migration is safe.
select cron.schedule(
  'daily-reminders-sweep',
  '0 6 * * *', -- 06:00 UTC daily
  $$
  select net.http_post(
    url := 'https://minister-s-library-keeper-1l3b-7knzrendn-heryordele1.vercel.app/api/public/hooks/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_3z1kiyAnUFYR50i32hkpDA_Ecvl4qTV'
    ),
    body := '{}'::jsonb
  );
  $$
);
