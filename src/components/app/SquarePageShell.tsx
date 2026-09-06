import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings2, Plus } from "lucide-react";

interface Props {
  title: string;
  icon: string;            // emoji
  blurb?: string;
  onAdd?: () => void;
  addLabel?: string;
  onProperties?: () => void;
  children: ReactNode;
  rightSlot?: ReactNode;
}

/**
 * Shared header + body wrapper for every Square's full page.
 * Keeps title / "Add" / "Properties" affordances consistent.
 */
export function SquarePageShell({ title, icon, blurb, onAdd, addLabel = "Add", onProperties, children, rightSlot }: Props) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link to="/app/dashboard" className="mono text-[10px] text-muted-foreground hover:text-brand">← back to control room</Link>
          <h1 className="text-2xl font-semibold tracking-tight mt-1 flex items-center gap-2">
            <span className="text-brand">{icon}</span> {title}
          </h1>
          {blurb && <p className="text-sm text-muted-foreground mt-1">{blurb}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
          {onProperties && (
            <button onClick={onProperties} className="btn-outline-brand text-xs py-1.5 px-3">
              <Settings2 size={13} /> Properties
            </button>
          )}
          {onAdd && (
            <button onClick={onAdd} className="btn-brand text-xs py-1.5 px-3">
              <Plus size={13} /> {addLabel}
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
