import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NowBar } from "@/components/app/dashboard/NowBar";
import { ActiveSquaresSection } from "@/components/app/dashboard/ActiveSquaresSection";
import { WidgetsSection } from "@/components/app/dashboard/WidgetsSection";
import { Eye, EyeOff, Minus } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: DashboardPage });

interface DashPrefs { showNowBar: boolean; showSquares: boolean; density: "comfortable" | "compact" | "cozy"; }

const LS_MINIMAL_KEY = "cs_now_bar_minimal";

/**
 * Dashboard = three independent sections, each its own component with its
 * own data + concerns: Now Bar, Active Squares, Widgets. This shell only
 * owns the shared layout prefs (visibility + density) and a small always-
 * visible control strip to flip them — no section reaches into another.
 */
function DashboardPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<DashPrefs>({ showNowBar: true, showSquares: true, density: "comfortable" });
  const [nowBarMinimal, setNowBarMinimal] = useState(false);

  useEffect(() => {
    try { setNowBarMinimal(localStorage.getItem(LS_MINIMAL_KEY) === "1"); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("dash_show_greeting,dash_show_squares,dash_density").eq("id", user.id).maybeSingle();
      if (p) {
        const pp = p as { dash_show_greeting?: boolean; dash_show_squares?: boolean; dash_density?: string };
        setPrefs({
          showNowBar: pp.dash_show_greeting ?? true,
          showSquares: pp.dash_show_squares ?? true,
          density: (pp.dash_density as DashPrefs["density"]) ?? "comfortable",
        });
      }
    })();
  }, [user]);

  const updatePrefs = async (patch: Partial<DashPrefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    if (!user) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.showNowBar !== undefined) dbPatch.dash_show_greeting = patch.showNowBar;
    if (patch.showSquares !== undefined) dbPatch.dash_show_squares = patch.showSquares;
    if (patch.density !== undefined) dbPatch.dash_density = patch.density;
    await supabase.from("profiles").update(dbPatch as never).eq("id", user.id);
  };

  const toggleMinimal = () => {
    const next = !nowBarMinimal;
    setNowBarMinimal(next);
    try { localStorage.setItem(LS_MINIMAL_KEY, next ? "1" : "0"); } catch { /* noop */ }
  };

  const gap = prefs.density === "compact" ? "gap-2" : prefs.density === "cozy" ? "gap-6" : "gap-4";
  const sectionSpacing = prefs.density === "compact" ? "space-y-3" : prefs.density === "cozy" ? "space-y-8" : "space-y-6";

  return (
    <div className={sectionSpacing}>
      <div className="flex items-center gap-1.5 flex-wrap justify-end -mb-1">
        <LayoutToggle
          active={prefs.showNowBar}
          label={!prefs.showNowBar ? "Now bar: hidden" : nowBarMinimal ? "Now bar: minimal" : "Now bar: full"}
          icon={!prefs.showNowBar ? EyeOff : nowBarMinimal ? Minus : Eye}
          onClick={() => {
            if (!prefs.showNowBar) return updatePrefs({ showNowBar: true });
            if (!nowBarMinimal) return toggleMinimal();
            updatePrefs({ showNowBar: false });
          }}
        />
        <LayoutToggle
          active={prefs.showSquares}
          label={prefs.showSquares ? "Squares: shown" : "Squares: hidden"}
          icon={prefs.showSquares ? Eye : EyeOff}
          onClick={() => updatePrefs({ showSquares: !prefs.showSquares })}
        />
        <select
          value={prefs.density}
          onChange={(e) => updatePrefs({ density: e.target.value as DashPrefs["density"] })}
          className="mono text-[10px] uppercase bg-background border border-border rounded px-1.5 py-1 text-muted-foreground"
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="cozy">Cozy</option>
        </select>
      </div>

      <NowBar show={prefs.showNowBar} minimal={nowBarMinimal} />
      <ActiveSquaresSection show={prefs.showSquares} />
      <WidgetsSection gap={gap} />
    </div>
  );
}

function LayoutToggle({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Eye; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Click to cycle"
      className={`mono text-[10px] uppercase inline-flex items-center gap-1 px-1.5 py-1 rounded border transition-colors ${active ? "border-border/60 text-muted-foreground hover:text-brand hover:border-brand/40" : "border-border/30 text-muted-foreground/60 hover:text-brand"}`}
    >
      <Icon size={11} /> {label}
    </button>
  );
}
