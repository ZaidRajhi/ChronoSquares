import { useOverlays, type Overlay } from "@/lib/useOverlays";
import { Check, Lock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Renders the user's owned overlays as applyable cards, plus a CTA to
 * browse more in the marketplace. Used inside the Settings → Theme → Custom
 * section to replace the old hardcoded palette presets.
 */
export function OverlaysPicker() {
  const { ownedOverlays, owned, loading, apply } = useOverlays();
  const appliedId = owned.find((o) => o.is_applied)?.overlay_id;

  if (loading) return <p className="text-xs text-muted-foreground">Loading overlays…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Your overlays</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Visual skins for your workspace. Apply any you own.</p>
        </div>
        <Link to="/app/marketplace" className="text-xs text-brand inline-flex items-center gap-1 hover:underline">
          <Sparkles size={12} /> Browse more
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ownedOverlays.map((o) => (
          <OverlayCard key={o.id} overlay={o} applied={o.id === appliedId} onApply={() => apply(o)} />
        ))}
        {ownedOverlays.length === 0 && (
          <div className="col-span-full text-xs text-muted-foreground border border-dashed border-border rounded-lg p-4">
            You don't own any overlays yet. Visit the Marketplace to browse the catalogue.
          </div>
        )}
      </div>
    </div>
  );
}

function OverlayCard({ overlay, applied, onApply }: { overlay: Overlay; applied: boolean; onApply: () => void }) {
  const shapeLabel = overlay.shape && overlay.shape !== "rounded" ? overlay.shape : null;
  return (
    <button
      onClick={onApply}
      className={`group relative text-left p-3 rounded-xl border transition-all overflow-hidden ${applied ? "border-brand bg-muted/40" : "border-border hover:border-brand/40"}`}
    >
      <div className="flex gap-1 mb-2.5">
        {overlay.preview_swatches.map((c, i) => (
          <span key={i} className="flex-1 h-8 rounded-md" style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{overlay.name}</div>
          <div className="text-[10px] text-muted-foreground capitalize">
            {overlay.plan_tier}{shapeLabel ? ` · ${shapeLabel}` : ""}
          </div>
        </div>
        {applied && <Check size={14} className="text-brand shrink-0 mt-0.5" />}
      </div>
    </button>
  );
}

export function MarketplaceOverlayCard({ overlay, owned, onAcquire }: { overlay: Overlay; owned: boolean; onAcquire: () => void }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
      <div className="flex gap-1">
        {overlay.preview_swatches.map((c, i) => (
          <span key={i} className="flex-1 h-10 rounded-md" style={{ background: c }} />
        ))}
      </div>
      <div>
        <div className="text-sm font-medium flex items-center gap-2">
          {overlay.name}
          {overlay.plan_tier !== "free" && <Lock size={11} className="text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{overlay.description}</p>
        <div className="text-[10px] text-muted-foreground mt-1">by {overlay.author} · {overlay.plan_tier}</div>
      </div>
      <button
        onClick={onAcquire}
        disabled={owned}
        className={`w-full text-xs py-1.5 rounded-md transition-colors ${owned ? "bg-muted text-muted-foreground cursor-default" : "bg-brand text-brand-foreground hover:opacity-90"}`}
      >
        {owned ? "Owned" : overlay.plan_tier === "free" ? "Add free" : "Add to library"}
      </button>
    </div>
  );
}