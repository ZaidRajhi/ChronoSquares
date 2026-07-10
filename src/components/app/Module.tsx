import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;          // mono uppercase chip in the header
  meta?: string;           // mono right-side meta (e.g. timestamp/id)
  children: ReactNode;
  className?: string;
  hudCorners?: boolean;
}

/**
 * Glass module — the ONLY surface used for content inside /app.
 * Translucent dark glass with a mint hairline edge, plus optional HUD ticks.
 * No solid white cards, no hard borders.
 */
export function Module({ label, meta, children, className, hudCorners = true }: Props) {
  return (
    <div className={cn("module", hudCorners && "hud-corners", className)}>
      {(label || meta) && (
        <div className="module-header">
          <span>{label}</span>
          {meta && <span className="opacity-70">{meta}</span>}
        </div>
      )}
      <div className="module-body">{children}</div>
    </div>
  );
}
