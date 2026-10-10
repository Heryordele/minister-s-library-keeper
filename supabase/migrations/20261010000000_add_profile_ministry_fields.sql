-- Store the church/ministry name and position captured during onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS position TEXT;
