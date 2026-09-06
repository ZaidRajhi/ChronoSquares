import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useUserPrefs, type CustomPalette } from "@/lib/userPrefs";

/**
 * Theme catalogue backed by the existing `overlays` table. The table is
 * retained only as the legacy catalogue storage for palettes; no structural
 * overlay behaviour is applied anywhere in the app.
 */
export interface Theme {
  id: string;
  slug: string;
  name: string;
  description: string;
  preview_swatches: string[];
  palette: CustomPalette;
  plan_tier: string;
  author: string;
  is_default: boolean;
}

export interface UserTheme {
  id: string;
  overlay_id: string;
  is_applied: boolean;
}

function palettesEqual(a?: CustomPalette | null, b?: CustomPalette | null) {
  if (!a || !b) return false;
  return a.brand === b.brand
    && a.brandViolet === b.brandViolet
    && a.background === b.background
    && a.card === b.card;
}

export function useThemes() {
  const { user } = useAuth();
  const { setCustomPalette, customPalette, theme } = useUserPrefs();
  const [catalogue, setCatalogue] = useState<Theme[]>([]);
  const [owned, setOwned] = useState<UserTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cat }, ownedRes] = await Promise.all([
        supabase.from("overlays").select("*").order("plan_tier").order("name"),
        user
          ? supabase.from("user_overlays").select("*").eq("user_id", user.id)
          : Promise.resolve({ data: [] as UserTheme[] }),
      ]);
      if (cancelled) return;
      setCatalogue((cat as unknown as Theme[]) ?? []);
      setOwned(((ownedRes.data as unknown) as UserTheme[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const ownedIds = new Set(owned.map((item) => item.overlay_id));
  const ownedThemes = catalogue.filter((item) => ownedIds.has(item.id));
  const marketplaceThemes = catalogue.filter((item) => !ownedIds.has(item.id));

  const applyTheme = useCallback(async (selected: Theme) => {
    await setCustomPalette(selected.palette);
  }, [setCustomPalette]);

  const isThemeActive = useCallback(
    (selected: Theme) => theme === "custom" && palettesEqual(customPalette, selected.palette),
    [theme, customPalette],
  );

  const acquire = useCallback(async (selected: Theme) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_overlays")
      .insert({ user_id: user.id, overlay_id: selected.id, is_applied: false })
      .select()
      .single();
    if (error) throw error;
    setOwned((previous) => [...previous, data as unknown as UserTheme]);
  }, [user]);

  return {
    catalogue,
    owned,
    ownedThemes,
    marketplaceThemes,
    loading,
    applyTheme,
    isThemeActive,
    acquire,
  };
}