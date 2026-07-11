import { useOverlays, widgetModeFor, type Overlay, type OverlayShape } from "@/lib/useOverlays";
import { Check, Sparkles, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SHAPE_LABEL: Record<OverlayShape, string> = {
  rounded: "Rounded cubes",
  sharp: "Sharp edges",
  cloud: "Cloud / blob",
  minimal2d: "Flat, minimal",
  obelisk: "Obelisk (pointed)",
  orbital: "Orbital (circle)",
  rune: "Rune (hex)",
};

const WIDGET_MODE_LABEL: Record<string, string> = {
  calm: "Calm",
  hud: "HUD glow",
  terminal: "Terminal",
  poster: "Poster",
  artifact: "Artifact",
};

/** Small live preview of what an Active Squares tile looks like under this shape. */
function ShapeSwatch({ shape }: { shape: OverlayShape }) {
  const base = "size-9 border-2 border-brand/60 bg-brand/10 flex items-center justify-center shrink-0";
  const styleFor: Record<OverlayShape, string> = {
    rounded: "rounded-lg",
    sharp: "rounded-none",
    cloud: "rounded-[10px_16px_12px_14px/14px_10px_16px_12px]",
    minimal2d: "rounded-[3px]",
    obelisk: "rounded-t-full rounded-b-sm",
    orbital: "rounded-full",
    rune: "rounded-md rotate-45",
  };
  return <div className={`${base} ${styleFor[shape]}`} />;
}

/**
 * Overlay (style) picker — Settings → Overlays.
 * Applies ONLY structural presentation: Active Squares tile shape + the
 * Widgets section's visual mode. Leaves the color theme untouched — an
 * Overlay can be combined with any Theme.
 */
export function OverlayStylePicker() {
  const { ownedOverlays, loading, applyOverlay, clearOverlay, appliedOverlayId } = useOverlays();

  if (loading) return <p className="text-xs text-muted-foreground">Loading overlays…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Your overlays</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Restyle the dashboard — turn Active Squares from square tiles into circles, clouds, or runes, and give Widgets a matching mood.
          </p>
        </div>
        <Link to="/app/marketplace" className="text-xs text-brand inline-flex items-center gap-1 hover:underline shrink-0">
          <Sparkles size={12} /> Browse more
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={clearOverlay}
          className={`text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${!appliedOverlayId ? "border-brand bg-muted/40" : "border-border hover:border-brand/40"}`}
        >
          <div className="size-9 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center shrink-0">
            <RotateCcw size={14} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium">Default</div>
            <div className="text-[10px] text-muted-foreground">Rounded · Calm</div>
          </div>
          {!appliedOverlayId && <Check size={14} className="text-brand shrink-0 ml-auto" />}
        </button>
        {ownedOverlays.map((o) => (
          <OverlayCard key={o.id} overlay={o} applied={o.id === appliedOverlayId} onApply={() => applyOverlay(o)} />
        ))}
      </div>
    </div>
  );
}

function OverlayCard({ overlay, applied, onApply }: { overlay: Overlay; applied: boolean; onApply: () => void }) {
  const shape = overlay.shape ?? "rounded";
  const mode = widgetModeFor(overlay);
  return (
    <button
      onClick={onApply}
      className={`group relative text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${applied ? "border-brand bg-muted/40" : "border-border hover:border-brand/40"}`}
    >
      <ShapeSwatch shape={shape} />
      <div className="min-w-0">
        <div className="text-xs font-medium truncate">{overlay.name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{SHAPE_LABEL[shape]} · {WIDGET_MODE_LABEL[mode]}</div>
      </div>
      {applied && <Check size={14} className="text-brand shrink-0 ml-auto" />}
    </button>
  );
}
