-- Email the project owner when an institution admin request is filed.
-- A trigger pings the app's alert hook right away; the daily reminders
-- sweep also sends any alerts that didn't go out (e.g. the app was down).
-- notified_at records that the owner has been emailed, so each request
-- produces one alert.

ALTER TABLE public.institution_requests ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.ping_institution_request_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://minister-s-library-keeper.vercel.app/api/public/hooks/institution-requests',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_3z1kiyAnUFYR50i32hkpDA_Ecvl4qTV'
      ),
      body := '{}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    -- Never block a request over an alert; the daily sweep will catch it.
    RAISE WARNING 'institution request alert ping failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ping_institution_request_alert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_institution_request_created ON public.institution_requests;
CREATE TRIGGER on_institution_request_created
  AFTER INSERT ON public.institution_requests
  FOR EACH ROW EXECUTE FUNCTION public.ping_institution_request_alert();
