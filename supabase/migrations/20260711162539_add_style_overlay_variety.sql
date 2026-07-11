-- Adds structural-style overlay variety (circle/cloud/rune tile shapes) so the
-- new Settings → Overlays picker has more than "rounded" + "sharp" to offer.
-- Widget mode pairing lives client-side (see WIDGET_MODE_BY_SLUG in
-- src/lib/useOverlays.ts) since `overlays` has no widget_mode column.
INSERT INTO public.overlays (slug, name, description, preview_swatches, palette, plan_tier, shape) VALUES
('orbital-halo', 'Orbital Halo', 'Circular tiles with a cool cyan-glass glow — a HUD-style read on your Squares.',
  '["#38BDF8","#0EA5E9","#0B1B2B"]'::jsonb,
  '{"brand":"oklch(0.78 0.13 220)","brandViolet":"oklch(0.6 0.15 250)","background":"oklch(0.16 0.02 235)","card":"oklch(0.22 0.02 235)"}'::jsonb,
  'free', 'orbital'),
('cloud-drift', 'Cloud Drift', 'Soft blob silhouettes on warm pastel paper — an editorial, poster-like feel.',
  '["#F0ABFC","#FDE68A","#FFF7ED"]'::jsonb,
  '{"brand":"oklch(0.68 0.1 340)","brandViolet":"oklch(0.62 0.12 300)","background":"oklch(0.96 0.01 60)","card":"oklch(0.98 0.006 60)"}'::jsonb,
  'free', 'cloud'),
('runed-obsidian', 'Runed Obsidian', 'Hex-cut runic tiles over deep violet-black — an artifact-grade relic look.',
  '["#A78BFA","#7C3AED","#12081F"]'::jsonb,
  '{"brand":"oklch(0.72 0.16 300)","brandViolet":"oklch(0.5 0.2 305)","background":"oklch(0.14 0.03 300)","card":"oklch(0.2 0.03 300)"}'::jsonb,
  'personal', 'rune')
ON CONFLICT (slug) DO NOTHING;

-- Grant the two new free overlays to every existing profile (the trigger
-- only fires for newly-inserted profiles).
INSERT INTO public.user_overlays (user_id, overlay_id, is_applied)
SELECT p.id, o.id, false
FROM public.profiles p
CROSS JOIN public.overlays o
WHERE o.slug IN ('orbital-halo', 'cloud-drift')
ON CONFLICT (user_id, overlay_id) DO NOTHING;
