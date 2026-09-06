import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export interface BeltItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

/**
 * RotatingBelt — circular nav with Dashboard pinned center.
 * Side items rotate through the user's enabled Squares + add-ons via hover or arrow click.
 * Used when the flat top-bar nav doesn't fit on the current viewport.
 */
export function RotatingBelt({ items, dashboard }: { items: BeltItem[]; dashboard: BeltItem }) {
  const [offset, setOffset] = useState(0);
  const loc = useLocation();
  const VISIBLE_PER_SIDE = 2;
  const total = items.length;

  const left: BeltItem[] = useMemo(() => {
    if (total === 0) return [];
    return Array.from({ length: VISIBLE_PER_SIDE }, (_, i) => {
      const idx = (((offset - (i + 1)) % total) + total) % total;
      return items[idx];
    }).reverse();
  }, [items, offset, total]);

  const right: BeltItem[] = useMemo(() => {
    if (total === 0) return [];
    return Array.from({ length: VISIBLE_PER_SIDE }, (_, i) => {
      const idx = (((offset + i) % total) + total) % total;
      return items[idx];
    });
  }, [items, offset, total]);

  const rotate = (delta: number) => setOffset((o) => (((o + delta) % Math.max(total, 1)) + Math.max(total, 1)) % Math.max(total, 1));

  const Pill = ({ item, active }: { item: BeltItem; active: boolean }) => (
    <Link
      to={item.to}
      className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] mono uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
        active
          ? "bg-brand/15 text-brand border border-brand/40"
          : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
      }`}
      title={item.label}
    >
      <item.icon size={12} />
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  );

  return (
    <div
      className="flex items-center gap-1"
      onMouseEnter={() => {/* pause if we add auto-rotate later */}}
    >
      <button
        onClick={() => rotate(-1)}
        className="p-1 rounded-full text-muted-foreground hover:text-brand hover:bg-muted/40 transition-colors"
        aria-label="Rotate left"
        type="button"
      >
        <ChevronLeft size={12} />
      </button>

      <div className="flex items-center gap-1">
        {left.map((it, i) => (
          <Pill key={`l-${i}-${it.to}`} item={it} active={loc.pathname === it.to} />
        ))}
      </div>

      {/* Dashboard core — visually distinct, slightly larger */}
      <Link
        to={dashboard.to}
        className={`mx-1 flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] mono uppercase tracking-wider border transition-all ${
          loc.pathname === dashboard.to
            ? "bg-brand text-brand-foreground border-brand shadow-[var(--shadow-glow)]"
            : "bg-card border-brand/40 text-foreground hover:border-brand"
        }`}
      >
        <dashboard.icon size={13} />
        <span className="hidden sm:inline">Core</span>
      </Link>

      <div className="flex items-center gap-1">
        {right.map((it, i) => (
          <Pill key={`r-${i}-${it.to}`} item={it} active={loc.pathname === it.to} />
        ))}
      </div>

      <button
        onClick={() => rotate(1)}
        className="p-1 rounded-full text-muted-foreground hover:text-brand hover:bg-muted/40 transition-colors"
        aria-label="Rotate right"
        type="button"
      >
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
