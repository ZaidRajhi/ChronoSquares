import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type ThemePreference = "dark" | "light" | "system" | "custom";
export type NavPosition = "sidebar" | "top" | "bottom";

export interface CustomPalette {
  brand?: string;       // oklch or hex
  brandViolet?: string;
  background?: string;
  card?: string;
}

interface UserPrefs {
  theme: ThemePreference;
  navPosition: NavPosition;
  focusMode: boolean;
  themeChosen: boolean;
  customPalette: CustomPalette | null;
  navHiddenItems: string[];
}

interface PrefsCtx extends UserPrefs {
  loading: boolean;
  resolvedTheme: "dark" | "light";
  setTheme: (t: ThemePreference) => Promise<void>;
  setNavPosition: (p: NavPosition) => Promise<void>;
  setFocusMode: (v: boolean) => Promise<void>;
  setCustomPalette: (p: CustomPalette | null) => Promise<void>;
  markThemeChosen: () => Promise<void>;
  setNavHiddenItems: (items: string[]) => Promise<void>;
}

const DEFAULTS: UserPrefs = {
  theme: "dark",
  navPosition: "top",
  focusMode: false,
  themeChosen: true, // signed-out users don't need the modal
  customPalette: null,
  navHiddenItems: [],
};

const Ctx = createContext<PrefsCtx>({
  ...DEFAULTS,
  loading: false,
  resolvedTheme: "dark",
  setTheme: async () => {},
  setNavPosition: async () => {},
  setFocusMode: async () => {},
  setCustomPalette: async () => {},
  markThemeChosen: async () => {},
  setNavHiddenItems: async () => {},
});

function detectSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function UserPrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(detectSystemTheme());

  // React to OS theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystemTheme(mq.matches ? "light" : "dark");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Load prefs when user logs in
  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULTS);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("theme_preference, nav_position, focus_mode, theme_chosen, custom_palette, nav_hidden_items")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPrefs({
          theme: (data.theme_preference as ThemePreference) ?? "system",
          navPosition: (data.nav_position as NavPosition) ?? "top",
          focusMode: data.focus_mode ?? false,
          themeChosen: data.theme_chosen ?? false,
          customPalette: (data.custom_palette as CustomPalette) ?? null,
          navHiddenItems: Array.isArray((data as { nav_hidden_items?: unknown }).nav_hidden_items)
            ? ((data as { nav_hidden_items: string[] }).nav_hidden_items)
            : [],
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const resolvedTheme: "dark" | "light" = useMemo(() => {
    if (prefs.theme === "light") return "light";
    if (prefs.theme === "dark" || prefs.theme === "custom") return "dark";
    return systemTheme;
  }, [prefs.theme, systemTheme]);

  // Apply theme class + custom palette to <body>
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    body.classList.remove("theme-dark", "theme-light");
    body.classList.add(resolvedTheme === "light" ? "theme-light" : "theme-dark");

    // Restore overlay shape from localStorage on mount/theme-switch.
    // (apply() in useOverlays writes this when an overlay is selected.)
    try {
      const shape = localStorage.getItem("cs_overlay_shape") ?? "rounded";
      const mode = localStorage.getItem("cs_widget_mode") ?? "calm";
      body.classList.remove("shape-rounded", "shape-sharp", "shape-cloud", "shape-minimal2d", "shape-obelisk", "shape-orbital", "shape-rune");
      body.classList.remove("overlay-widgets-calm", "overlay-widgets-hud", "overlay-widgets-terminal", "overlay-widgets-poster", "overlay-widgets-artifact");
      body.classList.add(`shape-${shape}`);
      body.classList.add(`overlay-widgets-${mode}`);
    } catch { /* noop */ }

    // Apply custom palette overrides as inline CSS vars.
    // IMPORTANT: write to <body> (not <html>) — the .theme-dark / .theme-light
    // class lives on <body>, so its declarations would otherwise win the
    // cascade against vars set on <html>. Writing on <body> ensures the
    // overlay's brand/background actually take effect.
    const root = document.body;
    const apply = (cssVar: string, val?: string) => {
      if (val) root.style.setProperty(cssVar, val);
      else root.style.removeProperty(cssVar);
    };
    if (prefs.theme === "custom" && prefs.customPalette) {
      apply("--brand", prefs.customPalette.brand);
      apply("--brand-violet", prefs.customPalette.brandViolet);
      apply("--background", prefs.customPalette.background);
      apply("--card", prefs.customPalette.card);
      // Sync downstream tokens that derive from brand/background
      if (prefs.customPalette.brand) {
        apply("--primary", prefs.customPalette.brand);
        apply("--ring", prefs.customPalette.brand);
        apply("--accent", prefs.customPalette.brand);
      }
    } else {
      apply("--brand");
      apply("--brand-violet");
      apply("--background");
      apply("--card");
      apply("--primary");
      apply("--ring");
      apply("--accent");
    }
  }, [resolvedTheme, prefs.theme, prefs.customPalette]);

  const update = useCallback(async (patch: Partial<UserPrefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    if (!user) return;
    const dbPatch: {
      theme_preference?: ThemePreference;
      nav_position?: NavPosition;
      focus_mode?: boolean;
      theme_chosen?: boolean;
      custom_palette?: CustomPalette | null;
      nav_hidden_items?: string[];
    } = {};
    if (patch.theme !== undefined) dbPatch.theme_preference = patch.theme;
    if (patch.navPosition !== undefined) dbPatch.nav_position = patch.navPosition;
    if (patch.focusMode !== undefined) dbPatch.focus_mode = patch.focusMode;
    if (patch.themeChosen !== undefined) dbPatch.theme_chosen = patch.themeChosen;
    if (patch.customPalette !== undefined) dbPatch.custom_palette = patch.customPalette;
    if (patch.navHiddenItems !== undefined) dbPatch.nav_hidden_items = patch.navHiddenItems;
    if (Object.keys(dbPatch).length > 0) {
      // custom_palette is JSON in the DB; cast as needed
      await supabase.from("profiles").update(dbPatch as never).eq("id", user.id);
    }
  }, [user]);

  const value: PrefsCtx = {
    ...prefs,
    loading,
    resolvedTheme,
    setTheme: (t) => update({ theme: t, themeChosen: true }),
    setNavPosition: (p) => update({ navPosition: p }),
    setFocusMode: (v) => update({ focusMode: v }),
    setCustomPalette: (p) => update({ customPalette: p, theme: p ? "custom" : "dark" }),
    markThemeChosen: () => update({ themeChosen: true }),
    setNavHiddenItems: (items) => update({ navHiddenItems: items }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserPrefs() {
  return useContext(Ctx);
}
