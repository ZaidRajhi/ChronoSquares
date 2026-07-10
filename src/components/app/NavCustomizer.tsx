import { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Settings2, Eye, EyeOff, Check } from "lucide-react";
import { useUserPrefs } from "@/lib/userPrefs";
import type { LayoutDashboard } from "lucide-react";

export interface CustomizableNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  required?: boolean; // can't be hidden (Dashboard, Settings)
}

/**
 * Tiny popover that lets a user toggle which nav items appear.
 * Lives in the AppShell next to the avatar/sign-out cluster.
 */
export function NavCustomizer({ items }: { items: CustomizableNavItem[] }) {
  const { navHiddenItems, setNavHiddenItems } = useUserPrefs();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      const r = btnRef.current!.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const toggle = (to: string) => {
    if (navHiddenItems.includes(to)) {
      setNavHiddenItems(navHiddenItems.filter((t) => t !== to));
    } else {
      setNavHiddenItems([...navHiddenItems, to]);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md text-muted-foreground hover:text-brand hover:bg-muted transition-colors"
        aria-label="Customize navigation"
        title="Customize navigation"
        type="button"
      >
        <Settings2 size={14} />
      </button>
      {open && pos && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            className="fixed w-64 rounded-xl border border-border bg-card shadow-2xl z-[9999] p-2"
            style={{ top: pos.top, right: pos.right }}
          >
            <div className="px-2 pt-1 pb-2 mono text-[10px] uppercase text-muted-foreground tracking-wider">
              Show in nav
            </div>
            <div className="max-h-72 overflow-y-auto">
              {items.map((it) => {
                const hidden = navHiddenItems.includes(it.to);
                const disabled = it.required;
                return (
                  <button
                    key={it.to}
                    onClick={() => !disabled && toggle(it.to)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs ${
                      disabled ? "text-muted-foreground/60 cursor-not-allowed" : "hover:bg-muted text-foreground"
                    }`}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <it.icon size={13} /> {it.label}
                    </span>
                    {disabled ? (
                      <span className="mono text-[9px] text-muted-foreground uppercase">Pinned</span>
                    ) : hidden ? (
                      <EyeOff size={12} className="text-muted-foreground" />
                    ) : (
                      <Check size={12} className="text-brand" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="px-2 pt-2 mt-1 border-t border-border text-[10px] text-muted-foreground">
              Hidden items remain reachable from ⌘K.
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
