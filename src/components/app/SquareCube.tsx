import { Link } from "@tanstack/react-router";
import type { SquareDef } from "@/lib/squares";

interface Props {
  square: SquareDef;
  primaryStat?: string;     // big number / short text on left face
  secondaryStat?: string;   // shown on right face
}

/**
 * Pure-CSS isometric cube. Three visible faces:
 *   top  -> name + icon
 *   left -> primary live stat
 *   right -> secondary stat
 * Sits inside `.iso-stage` for perspective. Click navigates to the Square.
 */
export function SquareCube({ square, primaryStat = "—", secondaryStat = "" }: Props) {
  return (
    <Link to={square.to} className="iso-stage block group">
      <div className="iso-cube">
        <div className="face top">
          <div className="glow-ring mb-2">{square.icon}</div>
          <div className="font-semibold text-sm tracking-tight">{square.name}</div>
          <div className="mono text-[10px] text-muted-foreground mt-0.5">{square.blurb}</div>
        </div>
        <div className="face left mono">{primaryStat}</div>
        <div className="face right mono">{secondaryStat}</div>
      </div>
    </Link>
  );
}
