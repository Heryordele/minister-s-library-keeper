-- Records which lending reminders have been sent, so the daily sweep sends
-- each one once. A reminder is keyed by loan, audience (owner or borrower),
-- milestone and the due date it was sent for, so extending a loan (a new
-- due date) starts its reminders afresh.
--   due_soon   : up to 3 days before the due date
--   overdue_1  : 1+ days overdue
--   overdue_7  : 7+ days overdue
--   overdue_14 : 14+ days overdue

CREATE TABLE IF NOT EXISTS public.lending_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrow_record_id UUID NOT NULL REFERENCES public.borrow_records(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('owner', 'borrower')),
  milestone TEXT NOT NULL CHECK (milestone IN ('due_soon', 'overdue_1', 'overdue_7', 'overdue_14')),
  due_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (borrow_record_id, audience, milestone, due_date)
);

-- Written and read only by the server (service role); no app-user access.
GRANT ALL ON public.lending_reminders TO service_role;
ALTER TABLE public.lending_reminders ENABLE ROW LEVEL SECURITY;

-- Loans already past a milestone before this change are marked as reminded,
-- so nobody gets a late reminder about an old loan when this goes live.
INSERT INTO public.lending_reminders (borrow_record_id, audience, milestone, due_date)
SELECT r.id, a.audience, m.milestone, r.expected_return_date
FROM public.borrow_records r
CROSS JOIN (VALUES ('owner'), ('borrower')) AS a(audience)
CROSS JOIN (VALUES ('due_soon', -3), ('overdue_1', 1), ('overdue_7', 7), ('overdue_14', 14))
  AS m(milestone, offset_days)
WHERE r.status = 'borrowed'
  AND r.expected_return_date IS NOT NULL
  AND CURRENT_DATE >= r.expected_return_date + m.offset_days
ON CONFLICT DO NOTHING;
