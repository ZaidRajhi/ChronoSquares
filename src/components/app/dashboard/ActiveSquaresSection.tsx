import { Link } from "@tanstack/react-router";
import { Sparkles, Settings2 } from "lucide-react";
import { useActiveSquares } from "@/lib/useActiveSquares";
import { SquareCube } from "@/components/app/SquareCube";
import { Module } from "@/components/app/Module";

/**
 * Active Squares — self-contained dashboard section. Fetches its own
 * enabled squares and renders the tile grid. Tile silhouette (square,
 * circle, cloud, rune, …) comes entirely from the body-level overlay
 * shape class applied by Settings → Overlays — this component doesn't
 * need to know which shape is active.
 */
export function ActiveSquaresSection({ show }: { show: boolean }) {
  const { activeSquares, loading } = useActiveSquares();

  if (!show) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sparkles size={11} className="text-brand" /> Active squares · {activeSquares.length}
        </div>
        <Link to="/app/settings" className="mono text-[10px] uppercase text-muted-foreground hover:text-brand inline-flex items-center gap-1">
          <Settings2 size={11} /> Configure
        </Link>
      </div>
      {loading ? (
        <div className="text-muted-foreground text-sm">Booting squares…</div>
      ) : activeSquares.length === 0 ? (
        <Module label="Empty">
          <p className="text-sm text-muted-foreground">No squares enabled yet. Activate some from <Link to="/app/settings" className="text-brand hover:underline">Settings</Link>.</p>
        </Module>
      ) : (
        <div className="iso-floor-grid rounded-2xl p-6 sm:p-10 bg-card/20 border border-border/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {activeSquares.map((s) => (
              <SquareCube key={s.slug} square={s} primaryStat="—" secondaryStat="LIVE" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
