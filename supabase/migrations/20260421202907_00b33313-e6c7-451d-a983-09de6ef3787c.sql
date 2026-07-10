
-- Workflow rules
CREATE TABLE public.workflow_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  source_square TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_square TEXT NOT NULL,
  action TEXT NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  run_count INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workflow rules"
  ON public.workflow_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_workflow_rules_updated_at
  BEFORE UPDATE ON public.workflow_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Overlays catalogue
CREATE TABLE public.overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  preview_swatches JSONB NOT NULL DEFAULT '[]'::jsonb,
  palette JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan_tier TEXT NOT NULL DEFAULT 'personal',
  author TEXT NOT NULL DEFAULT 'ChronoSquares',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.overlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active overlays"
  ON public.overlays
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage overlays"
  ON public.overlays
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User-owned overlays
CREATE TABLE public.user_overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  overlay_id UUID NOT NULL,
  is_applied BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, overlay_id)
);

ALTER TABLE public.user_overlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own overlays"
  ON public.user_overlays
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed overlays
INSERT INTO public.overlays (slug, name, description, preview_swatches, palette, plan_tier, is_default) VALUES
('obsidian-forest', 'Obsidian Forest', 'The signature ChronoSquares atmosphere — sage on deep emerald.',
  '["#8AB79B","#2D4A3E","#0D1312"]'::jsonb,
  '{"brand":"oklch(0.74 0.06 158)","brandViolet":"oklch(0.42 0.05 162)","background":"oklch(0.18 0.012 168)","card":"oklch(0.24 0.013 168)"}'::jsonb,
  'free', true),
('solar-daylight', 'Solar Daylight', 'Sage on warm paper — for the well-lit thinker.',
  '["#2D4A3E","#E8E2D5","#FFFFFF"]'::jsonb,
  '{"brand":"oklch(0.55 0.08 158)","brandViolet":"oklch(0.42 0.05 162)","background":"oklch(0.97 0.005 95)","card":"oklch(0.99 0.003 95)"}'::jsonb,
  'free', false),
('midnight-indigo', 'Midnight Indigo', 'Deep navy with electric indigo accents.',
  '["#4F46E5","#1E1E5A","#0A0A1A"]'::jsonb,
  '{"brand":"oklch(0.7 0.18 270)","brandViolet":"oklch(0.55 0.2 290)","background":"oklch(0.15 0.04 270)","card":"oklch(0.21 0.04 270)"}'::jsonb,
  'personal', false),
('cyber-cyan', 'Cyber Cyan', 'Neon cyan over slate — terminal energy.',
  '["#22D3EE","#7C3AED","#0B1220"]'::jsonb,
  '{"brand":"oklch(0.78 0.16 215)","brandViolet":"oklch(0.55 0.22 295)","background":"oklch(0.14 0.02 240)","card":"oklch(0.2 0.02 240)"}'::jsonb,
  'personal', false),
('burnt-amber', 'Burnt Amber', 'Warm copper on espresso — analog warmth.',
  '["#F59E0B","#B45309","#1C1410"]'::jsonb,
  '{"brand":"oklch(0.75 0.15 65)","brandViolet":"oklch(0.55 0.18 30)","background":"oklch(0.16 0.02 40)","card":"oklch(0.22 0.02 40)"}'::jsonb,
  'personal', false),
('vapor-chrome', 'Vapor Chrome', 'Iridescent pastels with metallic feel — Y2K futurism.',
  '["#C4B5FD","#67E8F9","#1A1A2E"]'::jsonb,
  '{"brand":"oklch(0.78 0.12 290)","brandViolet":"oklch(0.7 0.15 200)","background":"oklch(0.18 0.04 280)","card":"oklch(0.24 0.04 280)"}'::jsonb,
  'personal', false);

-- Auto-grant free overlays to existing + new users via trigger
CREATE OR REPLACE FUNCTION public.grant_default_overlays()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_overlays (user_id, overlay_id, is_applied)
  SELECT NEW.id, o.id, o.is_default
  FROM public.overlays o
  WHERE o.plan_tier = 'free'
  ON CONFLICT (user_id, overlay_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER grant_overlays_after_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.grant_default_overlays();

-- Backfill for existing profiles
INSERT INTO public.user_overlays (user_id, overlay_id, is_applied)
SELECT p.id, o.id, o.is_default
FROM public.profiles p
CROSS JOIN public.overlays o
WHERE o.plan_tier = 'free'
ON CONFLICT (user_id, overlay_id) DO NOTHING;
