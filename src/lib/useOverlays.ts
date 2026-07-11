import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useUserPrefs, type CustomPalette } from "@/lib/userPrefs";

export type OverlayShape = "rounded" | "sharp" | "cloud" | "minimal2d" | "obelisk" | "orbital" | "rune";
export type WidgetMode = "calm" | "hud" | "terminal" | "poster" | "artifact";

export interface Overlay {
  id: string;
  slug: string;
  name: string;
  description: string;
  preview_swatches: string[];
  palette: CustomPalette;
  plan_tier: string;
  author: string;
  is_default: boolean;
  shape?: OverlayShape;
}

export interface UserOverlay {
  id: string;
  overlay_id: string;
  is_applied: boolean;
}

/**
 * The `overlays` table only persists `shape` in the database (palette +
 * preview_swatches double as theme data). Widget mode is a purely
 * presentational pairing we keep client-side, keyed by slug, so every
 * overlay also carries a distinct "Widgets" personality without needing a
 * schema change. Falls back to "calm" for anything not listed here.
 */
const WIDGET_MODE_BY_SLUG: Record<string, WidgetMode> = {
  "obsidian-forest": "calm",
  "solar-daylight": "poster",
  "midnight-indigo": "hud",
  "cyber-cyan": "terminal",
  "burnt-amber": "terminal",
  "vapor-chrome": "artifact",
  "orbital-halo": "hud",
  "cloud-drift": "poster",
  "runed-obsidian": "artifact",
};

export function widgetModeFor(overlay: Pick<Overlay, "slug">): WidgetMode {
  return WIDGET_MODE_BY_SLUG[overlay.slug] ?? "calm";
}

const SHAPE_CLASSES = ["shape-rounded", "shape-sharp", "shape-cloud", "shape-minimal2d", "shape-obelisk", "shape-orbital", "shape-rune"];
const WIDGET_MODE_CLASSES = ["overlay-widgets-calm", "overlay-widgets-hud", "overlay-widgets-terminal", "overlay-widgets-poster", "overlay-widgets-artifact"];

function palettesEqual(a?: CustomPalette | null, b?: CustomPalette | null) {
  if (!a || !b) return false;
  return a.brand === b.brand && a.brandViolet === b.brandViolet && a.background === b.background && a.card === b.card;
}

/**
 * Hook for the overlay catalogue. The same catalogue entry powers two
 * independent, separately-applied concerns:
 *  - Theme (color palette) — see `applyTheme` / `isThemeActive`.
 *  - Overlay (structural style: Active Squares tile shape + widget mode)
 *    — see `applyOverlay` / `appliedOverlayId`.
 */
export function useOverlays() {
  const { user } = useAuth();
  const { setCustomPalette, customPalette, theme } = useUserPrefs();
  const [catalogue, setCatalogue] = useState<Overlay[]>([]);
  const [owned, setOwned] = useState<UserOverlay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cat }, ownedRes] = await Promise.all([
        supabase.from("overlays").select("*").order("plan_tier").order("name"),
        user ? supabase.from("user_overlays").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] as UserOverlay[] }),
      ]);
      if (cancelled) return;
      setCatalogue((cat as unknown as Overlay[]) ?? []);
      setOwned(((ownedRes.data as unknown) as UserOverlay[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const ownedIds = new Set(owned.map((o) => o.overlay_id));
  const ownedOverlays = catalogue.filter((o) => ownedIds.has(o.id));
  const marketplaceOverlays = catalogue.filter((o) => !ownedIds.has(o.id));
  const appliedOverlayId = owned.find((o) => o.is_applied)?.overlay_id;

  /** Themes only change the app-wide color palette. Leaves tile shape / widget mode untouched. */
  const applyTheme = useCallback(async (overlay: Overlay) => {
    await setCustomPalette(overlay.palette);
  }, [setCustomPalette]);

  const isThemeActive = useCallback((overlay: Overlay) => theme === "custom" && palettesEqual(customPalette, overlay.palette), [theme, customPalette]);

  /** Overlays only change dashboard-section structure: Active Squares tile shape + Widgets visual mode. Leaves color theme untouched. */
  const applyOverlay = useCallback(async (overlay: Overlay) => {
    if (!user) return;
    await supabase.from("user_overlays").update({ is_applied: false }).eq("user_id", user.id);
    await supabase.from("user_overlays").update({ is_applied: true }).eq("user_id", user.id).eq("overlay_id", overlay.id);
    const shape = overlay.shape ?? "rounded";
    const mode = widgetModeFor(overlay);
    if (typeof document !== "undefined") {
      document.body.classList.remove(...SHAPE_CLASSES, ...WIDGET_MODE_CLASSES);
      document.body.classList.add(`shape-${shape}`, `overlay-widgets-${mode}`);
      try {
        localStorage.setItem("cs_overlay_shape", shape);
        localStorage.setItem("cs_widget_mode", mode);
      } catch { /* noop */ }
    }
    setOwned((prev) => prev.map((o) => ({ ...o, is_applied: o.overlay_id === overlay.id })));
  }, [user]);

  const clearOverlay = useCallback(async () => {
    if (!user) return;
    await supabase.from("user_overlays").update({ is_applied: false }).eq("user_id", user.id);
    if (typeof document !== "undefined") {
      document.body.classList.remove(...SHAPE_CLASSES, ...WIDGET_MODE_CLASSES);
      document.body.classList.add("shape-rounded", "overlay-widgets-calm");
      try {
        localStorage.setItem("cs_overlay_shape", "rounded");
        localStorage.setItem("cs_widget_mode", "calm");
      } catch { /* noop */ }
    }
    setOwned((prev) => prev.map((o) => ({ ...o, is_applied: false })));
  }, [user]);

  const acquire = useCallback(async (overlay: Overlay) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_overlays")
      .insert({ user_id: user.id, overlay_id: overlay.id, is_applied: false })
      .select()
      .single();
    if (error) throw error;
    setOwned((prev) => [...prev, data as unknown as UserOverlay]);
  }, [user]);

  return {
    catalogue, owned, ownedOverlays, marketplaceOverlays, loading,
    appliedOverlayId,
    applyTheme, isThemeActive,
    applyOverlay, clearOverlay,
    acquire,
  };
}
