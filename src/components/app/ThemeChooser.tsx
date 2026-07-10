import { useUserPrefs } from "@/lib/userPrefs";
import { Moon, Sun, Monitor, Sparkles } from "lucide-react";

/**
 * First-login modal that lets the user pick between dark, light, or system.
 * Shows only when `themeChosen` is false on the loaded profile.
 */
export function ThemeChooser() {
  const { themeChosen, loading, setTheme } = useUserPrefs();
  if (loading || themeChosen) return null;

  const options = [
    { key: "dark" as const, label: "Obsidian", icon: Moon, sub: "Dark, focused, the ChronoSquares signature." },
    { key: "light" as const, label: "Daylight", icon: Sun, sub: "Bright, sage on warm paper." },
    { key: "system" as const, label: "System", icon: Monitor, sub: "Follow your OS preference." },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-7 w-full max-w-lg shadow-[var(--shadow-glow)]">
        <div className="flex items-center gap-2 text-xs text-brand uppercase tracking-wider mb-2">
          <Sparkles size={12} /> Welcome
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Choose your atmosphere</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You can change this anytime in Settings.
        </p>
        <div className="mt-6 grid gap-3">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setTheme(o.key)}
              className="text-left p-4 border border-border rounded-xl hover:border-brand hover:bg-muted/40 transition-colors flex items-start gap-3"
            >
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-brand">
                <o.icon size={16} />
              </div>
              <div>
                <div className="font-medium text-sm">{o.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
