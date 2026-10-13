-- Email the requester when their institution admin request is approved.
-- When a request's status changes to 'approved', the same alert hook used
-- for new requests is pinged; the daily reminders sweep is the fallback.
-- approval_notified_at records that the requester has been emailed.

ALTER TABLE public.institution_requests
  ADD COLUMN IF NOT EXISTS approval_notified_at TIMESTAMPTZ;

-- Requests approved before this change shouldn't get a late email.
UPDATE public.institution_requests
SET approval_notified_at = COALESCE(reviewed_at, now())
WHERE status = 'approved' AND approval_notified_at IS NULL;

DROP TRIGGER IF EXISTS on_institution_request_approved ON public.institution_requests;
CREATE TRIGGER on_institution_request_approved
  AFTER UPDATE OF status ON public.institution_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
  EXECUTE FUNCTION public.ping_institution_request_alert();
