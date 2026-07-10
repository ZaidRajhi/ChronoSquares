import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Shield, Settings, LogOut, Maximize2, Minimize2, Menu, X, Sprout, CheckSquare, Target, NotebookPen, Film, Wallet, Clock, Swords, Workflow, Store, Users } from "lucide-react";
import { CSLogo } from "@/components/CSLogo";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/lib/useUserRole";
import { useUserPrefs } from "@/lib/userPrefs";
import { useActiveSquares } from "@/lib/useActiveSquares";
import type { SquareSlug } from "@/lib/squares";
import { AIArchitect } from "@/components/app/AIArchitect";
import { CommandPalette } from "@/components/app/CommandPalette";
import { RotatingBelt, type BeltItem } from "@/components/app/RotatingBelt";
import { NavCustomizer, type CustomizableNavItem } from "@/components/app/NavCustomizer";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  required?: boolean;
}

const SQUARE_ICONS: Record<SquareSlug, typeof LayoutDashboard> = {
  habits: Sprout,
  tasks: CheckSquare,
  goals: Target,
  journal: NotebookPen,
  media: Film,
  finance: Wallet,
  time: Clock,
  gamification: Swords,
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { navPosition, focusMode, setFocusMode, navHiddenItems } = useUserPrefs();
  const { activeSquares } = useActiveSquares();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const squareItems: NavItem[] = activeSquares.map((s) => ({
    to: s.to,
    label: s.name,
    icon: SQUARE_ICONS[s.slug] ?? LayoutDashboard,
  }));
  const dashboardItem: NavItem = { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, required: true };
  const allItems: NavItem[] = [
    dashboardItem,
    ...squareItems,
    { to: "/app/workflows", label: "Workflows", icon: Workflow },
    { to: "/app/marketplace", label: "Marketplace", icon: Store },
    { to: "/app/communities", label: "Communities", icon: Users },
    { to: "/app/settings", label: "Settings", icon: Settings, required: true },
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield, required: true }] : []),
  ];
  const visibleItems: NavItem[] = allItems.filter((i) => !navHiddenItems.includes(i.to));
  const customizable: CustomizableNavItem[] = allItems.map((i) => ({ to: i.to, label: i.label, icon: i.icon, required: i.required }));

  const handleSignOut = () => signOut().then(() => navigate({ to: "/" }));

  // Focus mode: hide all nav, show a small floating exit chip
  if (focusMode) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
        <button
          onClick={() => setFocusMode(false)}
          className="fixed bottom-5 right-5 z-50 size-10 rounded-full bg-card border border-border shadow-[var(--shadow-glow)] flex items-center justify-center text-brand hover:scale-105 transition-transform"
          aria-label="Exit focus mode"
        >
          <Minimize2 size={16} />
        </button>
      </div>
    );
  }

  // SIDEBAR layout
  if (navPosition === "sidebar") {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/40 backdrop-blur-xl">
          <div className="p-5"><Link to="/app/dashboard"><CSLogo /></Link></div>
          <nav className="px-3 flex flex-col gap-1 text-sm">
            {visibleItems.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeProps={{ className: "flex items-center gap-2.5 px-3 py-2 rounded-md bg-muted text-foreground" }}
              >
                <i.icon size={15} /> {i.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto p-4 space-y-2">
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={() => setFocusMode(true)}
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-brand hover:bg-muted transition-colors"
              >
                <Maximize2 size={13} /> Focus mode
              </button>
              <NavCustomizer items={customizable} />
            </div>
            <div className="text-xs text-muted-foreground px-3 truncate">{user?.email}</div>
            <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3 w-full">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <MobileTopBar items={visibleItems} onSignOut={handleSignOut} onFocus={() => setFocusMode(true)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} userEmail={user?.email} customizable={customizable} />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">{children}</main>
        </div>
        <AIArchitect />
        <CommandPalette />
      </div>
    );
  }

  // BOTTOM nav layout
  if (navPosition === "bottom") {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="border-b border-border bg-card/60 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/app/dashboard"><CSLogo /></Link>
            <div className="flex items-center gap-2">
              <NavCustomizer items={customizable} />
              <button onClick={() => setFocusMode(true)} className="p-2 rounded-md text-muted-foreground hover:text-brand hover:bg-muted" aria-label="Focus mode">
                <Maximize2 size={15} />
              </button>
              <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3"><LogOut size={12} /> Sign out</button>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 pb-28">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 grid grid-flow-col auto-cols-fr">
            {visibleItems.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className="flex flex-col items-center gap-0.5 py-3 text-xs text-muted-foreground hover:text-brand transition-colors"
                activeProps={{ className: "flex flex-col items-center gap-0.5 py-3 text-xs text-brand" }}
              >
                <i.icon size={17} /> {i.label}
              </Link>
            ))}
          </div>
        </nav>
        <AIArchitect />
        <CommandPalette />
      </div>
    );
  }

  // TOP nav layout (default) — with overflow-detection → rotating belt
  return <TopNavLayout
    visibleItems={visibleItems}
    dashboardItem={dashboardItem}
    customizable={customizable}
    user={user}
    handleSignOut={handleSignOut}
    setFocusMode={setFocusMode}
    mobileOpen={mobileOpen}
    setMobileOpen={setMobileOpen}
    children={children}
  />;
}

function TopNavLayout({
  visibleItems, dashboardItem, customizable, user, handleSignOut, setFocusMode,
  mobileOpen, setMobileOpen, children,
}: {
  visibleItems: NavItem[];
  dashboardItem: NavItem;
  customizable: CustomizableNavItem[];
  user: { email?: string | null } | null;
  handleSignOut: () => void;
  setFocusMode: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  children: ReactNode;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  // Detect when flat items don't fit horizontally
  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      const el = measureRef.current;
      if (!el) return;
      // Flat row fits if its scrollWidth equals clientWidth (no horizontal overflow)
      setOverflow(el.scrollWidth > el.clientWidth + 4);
    };
    check();
    const ro = new ResizeObserver(check);
    if (measureRef.current) ro.observe(measureRef.current);
    window.addEventListener("resize", check);
    return () => { ro.disconnect(); window.removeEventListener("resize", check); };
  }, [visibleItems.length]);

  // Belt: everything except Dashboard (it's the core)
  const beltItems: BeltItem[] = visibleItems
    .filter((i) => i.to !== dashboardItem.to)
    .map((i) => ({ to: i.to, label: i.label, icon: i.icon }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to="/app/dashboard" className="shrink-0"><CSLogo /></Link>

            {/* Hidden measurement row to detect overflow */}
            <div ref={measureRef} className="hidden sm:flex items-center gap-1 text-sm flex-1 min-w-0 overflow-hidden">
              {!overflow ? (
                visibleItems.map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted text-foreground flex items-center gap-1.5 whitespace-nowrap" }}
                  >
                    <i.icon size={13} /> {i.label}
                  </Link>
                ))
              ) : (
                <RotatingBelt items={beltItems} dashboard={{ to: dashboardItem.to, label: dashboardItem.label, icon: dashboardItem.icon }} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <NavCustomizer items={customizable} />
            <button onClick={() => setFocusMode(true)} className="p-2 rounded-md text-muted-foreground hover:text-brand hover:bg-muted hidden sm:inline-flex" aria-label="Focus mode">
              <Maximize2 size={14} />
            </button>
            <span className="text-muted-foreground hidden md:inline text-xs">{user?.email}</span>
            <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3 hidden sm:inline-flex">
              <LogOut size={12} /> Sign out
            </button>
            <button className="sm:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="sm:hidden border-t border-border px-4 py-3 flex flex-col gap-2">
            {visibleItems.map((i) => (
              <Link key={i.to} to={i.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                <i.icon size={14} /> {i.label}
              </Link>
            ))}
            <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3 mt-2"><LogOut size={12} /> Sign out</button>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
      <AIArchitect />
      <CommandPalette />
    </div>
  );
}

function MobileTopBar({ items, onSignOut, onFocus, mobileOpen, setMobileOpen, userEmail, customizable }: {
  items: NavItem[];
  onSignOut: () => void;
  onFocus: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  userEmail?: string | null;
  customizable: CustomizableNavItem[];
}) {
  return (
    <header className="md:hidden border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="px-4 h-14 flex items-center justify-between">
        <Link to="/app/dashboard"><CSLogo /></Link>
        <div className="flex items-center gap-2">
          <NavCustomizer items={customizable} />
          <button onClick={onFocus} className="p-2 rounded-md text-muted-foreground" aria-label="Focus mode">
            <Maximize2 size={15} />
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2" aria-label="Menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
          {items.map((i) => (
            <Link key={i.to} to={i.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <i.icon size={14} /> {i.label}
            </Link>
          ))}
          <div className="text-xs text-muted-foreground pt-1">{userEmail}</div>
          <button onClick={onSignOut} className="btn-outline-brand text-xs py-1.5 px-3 mt-1"><LogOut size={12} /> Sign out</button>
        </div>
      )}
    </header>
  );
}
