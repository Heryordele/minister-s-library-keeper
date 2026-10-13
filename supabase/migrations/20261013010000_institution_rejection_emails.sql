-- Email the requester when their institution admin request is rejected.
-- Mirrors the approval email: a status change to 'rejected' pings the alert
-- hook, the daily reminders sweep is the fallback, and
-- rejection_notified_at records that the requester has been emailed.

ALTER TABLE public.institution_requests
  ADD COLUMN IF NOT EXISTS rejection_notified_at TIMESTAMPTZ;

-- Requests rejected before this change shouldn't get a late email.
UPDATE public.institution_requests
SET rejection_notified_at = COALESCE(reviewed_at, now())
WHERE status = 'rejected' AND rejection_notified_at IS NULL;

DROP TRIGGER IF EXISTS on_institution_request_rejected ON public.institution_requests;
CREATE TRIGGER on_institution_request_rejected
  AFTER UPDATE OF status ON public.institution_requests
  FOR EACH ROW
  WHEN (NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected')
  EXECUTE FUNCTION public.ping_institution_request_alert();
