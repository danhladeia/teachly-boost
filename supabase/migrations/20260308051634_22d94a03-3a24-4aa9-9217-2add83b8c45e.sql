
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS credits_remaining integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS logos_limit integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active';
