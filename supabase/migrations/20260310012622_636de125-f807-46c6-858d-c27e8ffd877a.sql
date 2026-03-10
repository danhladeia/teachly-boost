
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_general integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS credits_exams integer NOT NULL DEFAULT 10;

-- Migrate existing credits_remaining to credits_general
UPDATE public.profiles SET credits_general = credits_remaining;

-- Set exam credits based on plan type
UPDATE public.profiles SET credits_exams = CASE
  WHEN plan_type = 'starter' THEN 10
  WHEN plan_type = 'pro' THEN 50
  WHEN plan_type = 'master' THEN 80
  WHEN plan_type = 'ultra' THEN 0
  ELSE 10
END;
