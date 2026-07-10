import { createFileRoute } from "@tanstack/react-router";
import { useUserPrefs, type ThemePreference, type NavPosition } from "@/lib/userPrefs";
import { useAuth } from "@/lib/auth";
import { Moon, Sun, Monitor, Palette, Sidebar, PanelTop, PanelBottom, Maximize2 } from "lucide-react";
import { useState } from "react";
import { useActiveSquares } from "@/lib/useActiveSquares";
import { CORE_SQUARES, ADDON_SQUARES } from "@/lib/squares";
import { OverlaysPicker } from "@/components/app/OverlaysPicker";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: typeof Moon; sub: string }[] = [
  { key: "dark",   label: "Obsidian", icon: Moon,    sub: "ChronoSquares signature" },
  { key: "light",  label: "Daylight", icon: Sun,     sub: "Sage on warm paper" },
  { key: "system", label: "System",   icon: Monitor, sub: "Match your OS" },
  { key: "custom", label: "Custom",   icon: Palette, sub: "Pick your own palette" },
];

const NAV_OPTIONS: { key: NavPosition; label: string; icon: typeof Sidebar; sub: string }[] = [
  { key: "sidebar", label: "Sidebar", icon: Sidebar,     sub: "Vertical, on the left" },
  { key: "top",     label: "Top",     icon: PanelTop,    sub: "Horizontal bar at top" },
  { key: "bottom",  label: "Bottom",  icon: PanelBottom, sub: "Mobile-style bottom bar" },
];

function SettingsPage() {
  const { user } = useAuth();
  const { theme, navPosition, focusMode, setTheme, setNavPosition, setFocusMode } = useUserPrefs();
  const { enabled, setSquareEnabled } = useActiveSquares();
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSavedFlash(msg);
    setTimeout(() => setSavedFlash(null), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Make ChronoSquares feel like yours.</p>
      </div>

      {savedFlash && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-lg bg-card border border-brand/40 text-sm text-brand shadow-[var(--shadow-glow)]">
          {savedFlash}
        </div>
      )}

      {/* Theme */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Theme</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {THEME_OPTIONS.map((o) => {
            const active = theme === o.key;
            return (
              <button
                key={o.key}
                onClick={() => { setTheme(o.key); flash(`Theme: ${o.label}`); }}
                className={`text-left p-4 border rounded-xl transition-colors flex items-start gap-3 ${active ? "border-brand bg-muted/40" : "border-border hover:border-brand/40 hover:bg-muted/20"}`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center ${active ? "bg-brand text-brand-foreground" : "bg-muted text-brand"}`}>
                  <o.icon size={16} />
                </div>
                <div>
                  <div className="font-medium text-sm">{o.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {theme === "custom" && (
          <div className="mt-5 p-5 border border-border rounded-xl bg-card/50">
            <OverlaysPicker />
          </div>
        )}
      </section>

      {/* Navigation */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Navigation</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {NAV_OPTIONS.map((o) => {
            const active = navPosition === o.key;
            return (
              <button
                key={o.key}
                onClick={() => { setNavPosition(o.key); flash(`Nav: ${o.label}`); }}
                className={`text-left p-4 border rounded-xl transition-colors flex items-start gap-3 ${active ? "border-brand bg-muted/40" : "border-border hover:border-brand/40 hover:bg-muted/20"}`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center ${active ? "bg-brand text-brand-foreground" : "bg-muted text-brand"}`}>
                  <o.icon size={16} />
                </div>
                <div>
                  <div className="font-medium text-sm">{o.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Focus mode */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Focus mode</h2>
        <div className="p-5 border border-border rounded-xl flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-brand">
              <Maximize2 size={16} />
            </div>
            <div>
              <div className="font-medium text-sm">Hide navigation chrome</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Goes fullscreen with just your workspace. A small chip in the corner brings nav back.
              </div>
            </div>
          </div>
          <button
            onClick={() => { setFocusMode(!focusMode); flash(focusMode ? "Focus off" : "Focus on"); }}
            className={`relative w-11 h-6 rounded-full transition-colors ${focusMode ? "bg-brand" : "bg-muted"}`}
            aria-pressed={focusMode}
          >
            <span className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform ${focusMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Account</h2>
        <div className="p-5 border border-border rounded-xl text-sm">
          <div className="text-muted-foreground text-xs">Signed in as</div>
          <div className="font-medium">{user?.email}</div>
        </div>
      </section>

      {/* Squares */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Squares</h2>
        <p className="text-xs text-muted-foreground mb-4">Toggle which Squares appear in your nav and dashboard.</p>
        <div className="space-y-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Core</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {CORE_SQUARES.map((s) => (
                <SquareToggle key={s.slug} icon={s.icon} name={s.name} blurb={s.blurb} value={!!enabled[s.slug]} onChange={(v) => { setSquareEnabled(s.slug, v); flash(`${s.name} ${v ? "on" : "off"}`); }} />
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Add-ons</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {ADDON_SQUARES.map((s) => (
                <SquareToggle key={s.slug} icon={s.icon} name={s.name} blurb={s.blurb} value={!!enabled[s.slug]} onChange={(v) => { setSquareEnabled(s.slug, v); flash(`${s.name} ${v ? "on" : "off"}`); }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SquareToggle({ icon, name, blurb, value, onChange }: { icon: string; name: string; blurb: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card/40">
      <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-base">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{blurb}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${value ? "bg-brand" : "bg-muted"}`}
        style={{ height: "1.375rem" }}
        aria-pressed={value}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-card shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
