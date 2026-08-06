ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS receipt_url text;