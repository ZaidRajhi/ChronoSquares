
-- Per-widget appearance + dashboard preferences
ALTER TABLE public.dashboard_widgets
  ADD COLUMN IF NOT EXISTS appearance jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dash_show_greeting boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dash_show_squares boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dash_density text NOT NULL DEFAULT 'comfortable';
