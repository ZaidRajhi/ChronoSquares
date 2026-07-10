import { X } from "lucide-react";
import type { WidgetAppearance } from "@/lib/widgets";

interface Props {
  appearance: WidgetAppearance;
  onChange: (next: WidgetAppearance) => void;
  onClose: () => void;
}

const SURFACES: { v: NonNullable<WidgetAppearance["surface"]>; l: string }[] = [
  { v: "glass", l: "Glass" }, { v: "solid", l: "Solid" }, { v: "ghost", l: "Ghost" }, { v: "gradient", l: "Gradient" },
];
const SHAPES: { v: NonNullable<WidgetAppearance["shape"]>; l: string }[] = [
  { v: "rounded", l: "Rounded" }, { v: "sharp", l: "Sharp" }, { v: "pill", l: "Pill" }, { v: "organic", l: "Organic" },
];
const ACCENTS: NonNullable<WidgetAppearance["accent"]>[] = ["brand", "violet", "amber", "rose", "cyan", "emerald"];
const ACCENT_HEX: Record<NonNullable<WidgetAppearance["accent"]>, string> = {
  brand: "#34d399", violet: "#a78bfa", amber: "#f59e0b", rose: "#f43f5e", cyan: "#22d3ee", emerald: "#10b981",
};
const MODES: { v: NonNullable<WidgetAppearance["visualMode"]>; l: string; sub: string }[] = [
  { v: "calm", l: "Calm", sub: "quiet glass" },
  { v: "hud", l: "HUD", sub: "instrument panel" },
  { v: "terminal", l: "Terminal", sub: "command-line" },
  { v: "poster", l: "Poster", sub: "large editorial" },
  { v: "artifact", l: "Artifact", sub: "floating relic" },
];

export function WidgetCustomizer({ appearance, onChange, onClose }: Props) {
  const set = (patch: Partial<WidgetAppearance>) => onChange({ ...appearance, ...patch });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="module max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Customise widget</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
        </div>

        <Section label="Surface">
          <div className="grid grid-cols-4 gap-1.5">
            {SURFACES.map((s) => (
              <button key={s.v} onClick={() => set({ surface: s.v })} className={`text-xs py-1.5 rounded-md border ${appearance.surface === s.v ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand/50"}`}>{s.l}</button>
            ))}
          </div>
        </Section>

        <Section label="Shape">
          <div className="grid grid-cols-4 gap-1.5">
            {SHAPES.map((s) => (
              <button key={s.v} onClick={() => set({ shape: s.v })} className={`text-xs py-1.5 rounded-md border ${appearance.shape === s.v ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand/50"}`}>{s.l}</button>
            ))}
          </div>
        </Section>

        <Section label="Accent">
          <div className="flex gap-2">
            {ACCENTS.map((a) => (
              <button key={a} onClick={() => set({ accent: a })} className={`size-7 rounded-full border-2 ${appearance.accent === a ? "border-foreground" : "border-transparent"}`} style={{ background: ACCENT_HEX[a] }} />
            ))}
          </div>
        </Section>

        <Section label="Mode">
          <div className="grid grid-cols-5 gap-1.5">
            {MODES.map((m) => (
              <button key={m.v} onClick={() => set({ visualMode: m.v })} className={`text-left px-2 py-1.5 rounded-md border ${appearance.visualMode === m.v ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand/50"}`}>
                <div className="text-[11px] leading-tight">{m.l}</div>
                <div className="text-[9px] opacity-70 leading-tight">{m.sub}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section label="Tint">
          <div className="flex items-center gap-2">
            <input type="color" value={appearance.tintHex ?? "#000000"} onChange={(e) => set({ tintHex: e.target.value })} className="size-9 rounded" />
            <button onClick={() => set({ tintHex: undefined })} className="text-xs text-muted-foreground hover:text-brand">Clear</button>
          </div>
        </Section>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!appearance.hideHeader} onChange={(e) => set({ hideHeader: e.target.checked })} />
          Hide header
        </label>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="mono text-[10px] uppercase text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
