import { ReactNode } from "react";
import { Trash2, Maximize2, Palette, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetAppearance, WidgetSize } from "@/lib/widgets";

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  editing?: boolean;
  onRemove?: () => void;
  onResize?: () => void;
  onCustomize?: () => void;
  dragHandleProps?: Record<string, unknown>;
  className?: string;
  size?: WidgetSize;
  appearance?: WidgetAppearance;
}

const ACCENT_BAR: Record<NonNullable<WidgetAppearance["accent"]>, string> = {
  brand: "from-brand to-brand/40",
  violet: "from-brand-violet to-brand-violet/40",
  amber: "from-amber-500 to-amber-300",
  rose: "from-rose-500 to-rose-300",
  cyan: "from-cyan-400 to-cyan-200",
  emerald: "from-emerald-500 to-emerald-300",
};

const SHAPE_CLASS: Record<NonNullable<WidgetAppearance["shape"]>, string> = {
  rounded: "rounded-2xl",
  sharp: "rounded-none",
  pill: "rounded-[2rem]",
  organic: "rounded-[28px_42px_30px_44px/40px_30px_44px_28px]",
};

const SURFACE_CLASS: Record<NonNullable<WidgetAppearance["surface"]>, string> = {
  glass: "module",
  solid: "bg-card border border-border",
  ghost: "bg-transparent",
  gradient: "bg-gradient-to-br from-brand/10 via-transparent to-brand-violet/10 border border-border/40",
};

const MODE_CLASS: Record<NonNullable<WidgetAppearance["visualMode"]>, string> = {
  calm: "",
  hud: "hud-corners widget-mode-hud",
  terminal: "widget-mode-terminal",
  poster: "widget-mode-poster",
  artifact: "widget-mode-artifact",
};

export function WidgetShell({
  title,
  icon,
  children,
  editing,
  onRemove,
  onResize,
  onCustomize,
  dragHandleProps,
  className,
  appearance = {},
}: Props) {
  const surface = appearance.surface ?? "glass";
  const shape = appearance.shape ?? "rounded";
  const accent = appearance.accent ?? "brand";
  const visualMode = appearance.visualMode ?? "calm";
  const tint = appearance.tintHex;
  return (
    <div
      className={cn(
        "group relative overflow-hidden h-full transition-all duration-300",
        SURFACE_CLASS[surface],
        SHAPE_CLASS[shape],
        MODE_CLASS[visualMode],
        editing && "ring-2 ring-brand/40",
        className,
      )}
      style={tint ? { backgroundColor: tint } : undefined}
    >
      {surface !== "ghost" && (
        <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-70", ACCENT_BAR[accent])} />
      )}
      {!appearance.hideHeader && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
          <div className="flex items-center gap-2 mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {icon}
            <span>{title}</span>
          </div>
          {editing && (
            <div className="flex items-center gap-0.5">
              {onCustomize && (
                <button onClick={onCustomize} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Customize">
                  <Palette size={12} />
                </button>
              )}
              {onResize && (
                <button onClick={onResize} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" aria-label="Resize">
                  <Maximize2 size={12} />
                </button>
              )}
              {onRemove && (
                <button onClick={onRemove} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" aria-label="Remove">
                  <Trash2 size={12} />
                </button>
              )}
              <button {...dragHandleProps} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground cursor-grab active:cursor-grabbing touch-none" aria-label="Drag">
                <GripVertical size={13} />
              </button>
            </div>
          )}
        </div>
      )}
      <div className={cn("px-4 pb-4", appearance.hideHeader && "pt-4")}>{children}</div>
    </div>
  );
}
