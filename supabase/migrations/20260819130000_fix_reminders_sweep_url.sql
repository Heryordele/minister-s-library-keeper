-- The prior migration scheduled the reminders sweep against a Vercel preview
-- deployment URL (random per-deploy hash), which also turned out to sit
-- behind Vercel's deployment protection (SSO) and would 401 on every run.
-- Repoint at the stable production domain instead. cron.schedule() upserts
-- by job name, so this safely replaces the earlier schedule.
select cron.schedule(
  'daily-reminders-sweep',
  '0 6 * * *', -- 06:00 UTC daily
  $$
  select net.http_post(
    url := 'https://minister-s-library-keeper.vercel.app/api/public/hooks/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_3z1kiyAnUFYR50i32hkpDA_Ecvl4qTV'
    ),
    body := '{}'::jsonb
  );
  $$
);
