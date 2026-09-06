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
  foreground?: string;
  cardForeground?: string;
  muted?: string;
  mutedForeground?: string;
  border?: string;
  input?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  accentForeground?: string;
  sidebar?: string;
  sidebarForeground?: string;
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

function paletteIsLight(background?: string) {
  if (!background) return false;
  const oklch = background.match(/oklch\(\s*([0-9.]+)/i);
  if (oklch) return Number(oklch[1]) >= 0.58;
  const hex = background.replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 0.58;
  }
  return false;
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
      const p = prefs.customPalette;
      const light = paletteIsLight(p.background);
      const foreground = p.foreground ?? (light ? "oklch(0.22 0.012 168)" : "oklch(0.96 0.002 160)");
      const card = p.card ?? p.background ?? (light ? "oklch(1 0 0)" : "oklch(0.22 0.008 168)");
      const background = p.background ?? (light ? "oklch(0.99 0.004 160)" : "oklch(0.16 0.008 168)");
      const brand = p.brand ?? (light ? "oklch(0.58 0.08 158)" : "oklch(0.74 0.06 158)");
      const violet = p.brandViolet ?? (light ? "oklch(0.42 0.05 162)" : "oklch(0.40 0.05 162)");
      const muted = p.muted ?? (light ? "oklch(0.95 0.01 160)" : "oklch(0.26 0.010 168)");
      const mutedForeground = p.mutedForeground ?? (light ? "oklch(0.43 0.012 200)" : "oklch(0.70 0.008 160)");
      const border = p.border ?? (light ? "oklch(0.88 0.008 160)" : "oklch(0.30 0.012 168)");
      const primaryForeground = p.primaryForeground ?? (light ? "oklch(1 0 0)" : "oklch(0.16 0.008 168)");
      const secondary = p.secondary ?? muted;
      const secondaryForeground = p.secondaryForeground ?? foreground;
      const accentForeground = p.accentForeground ?? primaryForeground;
      const sidebar = p.sidebar ?? background;
      const sidebarForeground = p.sidebarForeground ?? foreground;
      const values: Record<string, string> = {
        "--brand": brand,
        "--brand-violet": violet,
        "--background": background,
        "--foreground": foreground,
        "--card": card,
        "--card-foreground": p.cardForeground ?? foreground,
        "--popover": card,
        "--popover-foreground": p.cardForeground ?? foreground,
        "--brand-foreground": primaryForeground,
        "--primary": brand,
        "--primary-foreground": primaryForeground,
        "--secondary": secondary,
        "--secondary-foreground": secondaryForeground,
        "--muted": muted,
        "--muted-foreground": mutedForeground,
        "--accent": brand,
        "--accent-foreground": accentForeground,
        "--border": border,
        "--input": p.input ?? border,
        "--ring": brand,
        "--sidebar": sidebar,
        "--sidebar-foreground": sidebarForeground,
        "--sidebar-primary": brand,
        "--sidebar-primary-foreground": primaryForeground,
        "--sidebar-accent": muted,
        "--sidebar-accent-foreground": secondaryForeground,
        "--sidebar-border": border,
        "--sidebar-ring": brand,
      };
      Object.entries(values).forEach(([name, value]) => apply(name, value));
    } else {
      [
        "--brand", "--brand-violet", "--background", "--foreground", "--card",
        "--card-foreground", "--popover", "--popover-foreground", "--brand-foreground",
        "--primary", "--primary-foreground", "--secondary", "--secondary-foreground",
        "--muted", "--muted-foreground", "--accent", "--accent-foreground", "--border",
        "--input", "--ring", "--sidebar", "--sidebar-foreground", "--sidebar-primary",
        "--sidebar-primary-foreground", "--sidebar-accent", "--sidebar-accent-foreground",
        "--sidebar-border", "--sidebar-ring",
      ].forEach((name) => apply(name));
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
