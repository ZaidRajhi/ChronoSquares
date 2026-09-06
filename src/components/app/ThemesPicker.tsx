import { useThemes, type Theme } from "@/lib/useThemes";
import { Check, Lock } from "lucide-react";

export function ThemesPicker() {
  const { ownedThemes, loading, applyTheme, isThemeActive } = useThemes();

  if (loading) return <p className="text-xs text-muted-foreground">Loading themes…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Your themes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Full color schemes for the entire app. Apply any you own.</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">Workspace palettes</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ownedThemes.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} applied={isThemeActive(theme)} onApply={() => applyTheme(theme)} />
        ))}
        {ownedThemes.length === 0 && (
          <div className="col-span-full text-xs text-muted-foreground border border-dashed border-border rounded-lg p-4">
            You don't own any themes yet. Browse the catalogue to choose a workspace palette.
          </div>
        )}
      </div>
    </div>
  );
}

export function ThemeMarketplaceCard({ theme, owned, onAcquire }: { theme: Theme; owned: boolean; onAcquire: () => void }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
      <div className="flex gap-1">
        {theme.preview_swatches.map((color, i) => (
          <span key={i} className="flex-1 h-10 rounded-md" style={{ background: color }} />
        ))}
      </div>
      <div>
        <div className="text-sm font-medium flex items-center gap-2">
          {theme.name}
          {theme.plan_tier !== "free" && <Lock size={11} className="text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{theme.description}</p>
        <div className="text-[10px] text-muted-foreground mt-1">by {theme.author} · {theme.plan_tier}</div>
      </div>
      <button
        onClick={onAcquire}
        disabled={owned}
        className={`w-full text-xs py-1.5 rounded-md transition-colors ${owned ? "bg-muted text-muted-foreground cursor-default" : "bg-brand text-brand-foreground hover:opacity-90"}`}
      >
        {owned ? "Owned" : theme.plan_tier === "free" ? "Add free" : "Add to library"}
      </button>
    </div>
  );
}

function ThemeCard({ theme, applied, onApply }: { theme: Theme; applied: boolean; onApply: () => void }) {
  return (
    <button
      onClick={onApply}
      className={`group relative text-left p-3 rounded-xl border transition-all overflow-hidden ${applied ? "border-brand bg-muted/40" : "border-border hover:border-brand/40"}`}
    >
      <div className="flex gap-1 mb-2.5">
        {theme.preview_swatches.map((color, i) => (
          <span key={i} className="flex-1 h-8 rounded-md" style={{ background: color }} />
        ))}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{theme.name}</div>
          <div className="text-[10px] text-muted-foreground capitalize">{theme.plan_tier}</div>
        </div>
        {applied && <Check size={14} className="text-brand shrink-0 mt-0.5" />}
      </div>
    </button>
  );
}