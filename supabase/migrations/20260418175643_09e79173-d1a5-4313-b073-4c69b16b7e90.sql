ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS custom_palette jsonb,
  ADD COLUMN IF NOT EXISTS focus_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme_chosen boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ALTER COLUMN nav_position SET DEFAULT 'top';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_theme_preference_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_preference_check
  CHECK (theme_preference IN ('dark', 'light', 'system', 'custom'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_nav_position_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_nav_position_check
  CHECK (nav_position IN ('sidebar', 'top', 'bottom'));