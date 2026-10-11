-- Store the library name and admin contact captured during institution onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS library_name TEXT,
  ADD COLUMN IF NOT EXISTS admin_email TEXT;
