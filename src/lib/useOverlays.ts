import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useUserPrefs } from "@/lib/userPrefs";

export interface Overlay {
  id: string;
  slug: string;
  name: string;
  description: string;
  preview_swatches: string[];
  palette: { brand?: string; brandViolet?: string; background?: string; card?: string };
  plan_tier: string;
  author: string;
  is_default: boolean;
  shape?: "rounded" | "sharp" | "cloud" | "minimal2d" | "obelisk" | "orbital" | "rune";
  dimension?: "iso3d" | "flat2d" | "obelisk" | "orbital" | "rune";
  widget_mode?: "calm" | "hud" | "terminal" | "poster" | "artifact";
}

export interface UserOverlay {
  id: string;
  overlay_id: string;
  is_applied: boolean;
}

/**
 * Hook for the overlay (skin) system.
 * Loads the catalogue + the user's owned overlays. Applying an overlay
 * writes it to user_overlays AND switches the user's theme to "custom"
 * with the overlay's palette via setCustomPalette.
 */
export function useOverlays() {
  const { user } = useAuth();
  const { setCustomPalette } = useUserPrefs();
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

  const apply = useCallback(async (overlay: Overlay) => {
    if (!user) return;
    // Mark this one applied, all others not
    await supabase.from("user_overlays").update({ is_applied: false }).eq("user_id", user.id);
    await supabase.from("user_overlays").update({ is_applied: true }).eq("user_id", user.id).eq("overlay_id", overlay.id);
    await setCustomPalette(overlay.palette);
    // Apply structural shape via body class
    if (typeof document !== "undefined") {
      document.body.classList.remove("shape-rounded", "shape-sharp", "shape-cloud", "shape-minimal2d", "shape-obelisk", "shape-orbital", "shape-rune");
      document.body.classList.add(`shape-${overlay.shape ?? "rounded"}`);
      try {
        localStorage.setItem("cs_overlay_shape", overlay.shape ?? "rounded");
        localStorage.setItem("cs_overlay_dimension", overlay.dimension ?? "iso3d");
        localStorage.setItem("cs_widget_mode", overlay.widget_mode ?? "calm");
      } catch { /* noop */ }
    }
    setOwned((prev) => prev.map((o) => ({ ...o, is_applied: o.overlay_id === overlay.id })));
  }, [user, setCustomPalette]);

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

  return { catalogue, owned, ownedOverlays, marketplaceOverlays, loading, apply, acquire };
}