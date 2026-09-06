import { ReactNode, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Shield, Settings, LogOut, Maximize2, Minimize2, Menu, X, ClipboardList, KanbanSquare, MessageSquare, Receipt, FolderOpen } from "lucide-react";
import { CSLogo } from "@/components/CSLogo";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/lib/useUserRole";
import { useUserPrefs } from "@/lib/userPrefs";
import { NavCustomizer, type CustomizableNavItem } from "@/components/app/NavCustomizer";
import { useDelivery } from "@/lib/delivery";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  required?: boolean;
}

const DELIVERY_ITEMS: NavItem[] = [
  { to: "/app/onboarding", label: "Onboarding", icon: ClipboardList },
  { to: "/app/project", label: "Project", icon: KanbanSquare },
  { to: "/app/communication", label: "Communication", icon: MessageSquare },
  { to: "/app/finance", label: "Finance", icon: Receipt },
  { to: "/app/files", label: "Files", icon: FolderOpen },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { navPosition, focusMode, setFocusMode, navHiddenItems } = useUserPrefs();
  const { role } = useDelivery();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardItem: NavItem = { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, required: true };
  const allItems: NavItem[] = [
    dashboardItem,
    ...DELIVERY_ITEMS,
    { to: "/app/settings", label: "Settings", icon: Settings, required: true },
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", icon: Shield, required: true }] : []),
  ];
  const visibleItems = allItems.filter((item) => !navHiddenItems.includes(item.to));
  const customizable: CustomizableNavItem[] = allItems.map((item) => ({ ...item }));
  const roleLabel = role === "provider" ? "Provider" : role === "client" ? "Client" : role === "contractor" ? "Contractor" : "Stakeholder";
  const handleSignOut = () => signOut().then(() => navigate({ to: "/" }));

  if (focusMode) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
        <button onClick={() => setFocusMode(false)} className="fixed bottom-5 right-5 z-50 size-10 rounded-full bg-card border border-border shadow-[var(--shadow-glow)] flex items-center justify-center text-brand hover:scale-105 transition-transform" aria-label="Exit focus mode">
          <Minimize2 size={16} />
        </button>
      </div>
    );
  }

  if (navPosition === "sidebar") {
    return (
      <div className="min-h-screen flex bg-background text-foreground">
        <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/40 backdrop-blur-xl">
          <div className="p-5"><Link to="/app/dashboard"><CSLogo /></Link></div>
          <nav className="px-3 flex flex-col gap-1 text-sm">
            {visibleItems.map((item) => <NavLink key={item.to} item={item} />)}
          </nav>
          <div className="mt-auto p-4 space-y-2">
            <div className="flex items-center gap-1 px-1">
              <button onClick={() => setFocusMode(true)} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-brand hover:bg-muted transition-colors"><Maximize2 size={13} /> Focus mode</button>
              <NavCustomizer items={customizable} />
            </div>
            <div className="text-xs text-muted-foreground px-3 truncate">{roleLabel} · {user?.email}</div>
            <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3 w-full"><LogOut size={12} /> Sign out</button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <MobileTopBar items={visibleItems} onSignOut={handleSignOut} onFocus={() => setFocusMode(true)} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} userEmail={user?.email} roleLabel={roleLabel} customizable={customizable} />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">{children}</main>
        </div>
      </div>
    );
  }

  if (navPosition === "bottom") {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <header className="border-b border-border bg-card/60 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/app/dashboard"><CSLogo /></Link>
            <div className="flex items-center gap-2">
              <span className="mono text-[10px] uppercase text-muted-foreground hidden sm:inline">{roleLabel}</span>
              <NavCustomizer items={customizable} />
              <button onClick={() => setFocusMode(true)} className="p-2 rounded-md text-muted-foreground hover:text-brand hover:bg-muted" aria-label="Focus mode"><Maximize2 size={15} /></button>
              <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3"><LogOut size={12} /> Sign out</button>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 pb-28">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 grid grid-flow-col auto-cols-fr">
            {visibleItems.map((item) => <NavLink key={item.to} item={item} bottom />)}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to="/app/dashboard" className="shrink-0"><CSLogo /></Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm flex-1 min-w-0 overflow-hidden">
              {visibleItems.map((item) => <NavLink key={item.to} item={item} />)}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm shrink-0">
            <span className="mono text-[10px] uppercase text-muted-foreground hidden md:inline">{roleLabel}</span>
            <NavCustomizer items={customizable} />
            <button onClick={() => setFocusMode(true)} className="p-2 rounded-md text-muted-foreground hover:text-brand hover:bg-muted hidden sm:inline-flex" aria-label="Focus mode"><Maximize2 size={14} /></button>
            <span className="text-muted-foreground hidden lg:inline text-xs">{user?.email}</span>
            <button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3 hidden sm:inline-flex"><LogOut size={12} /> Sign out</button>
            <button className="sm:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        {mobileOpen && <div className="sm:hidden border-t border-border px-4 py-3 flex flex-col gap-2">{visibleItems.map((item) => <NavLink key={item.to} item={item} onClick={() => setMobileOpen(false)} />)}<button onClick={handleSignOut} className="btn-outline-brand text-xs py-1.5 px-3 mt-2"><LogOut size={12} /> Sign out</button></div>}
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}

function NavLink({ item, bottom = false, onClick }: { item: NavItem; bottom?: boolean; onClick?: () => void }) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={bottom ? "flex flex-col items-center gap-0.5 py-3 text-xs text-muted-foreground hover:text-brand transition-colors" : "px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 whitespace-nowrap"}
      activeProps={{ className: bottom ? "flex flex-col items-center gap-0.5 py-3 text-xs text-brand" : "px-3 py-1.5 rounded-md bg-muted text-foreground flex items-center gap-1.5 whitespace-nowrap" }}
    >
      <item.icon size={bottom ? 17 : 13} /> {item.label}
    </Link>
  );
}

function MobileTopBar({ items, onSignOut, onFocus, mobileOpen, setMobileOpen, userEmail, roleLabel, customizable }: {
  items: NavItem[];
  onSignOut: () => void;
  onFocus: () => void;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  userEmail?: string | null;
  roleLabel: string;
  customizable: CustomizableNavItem[];
}) {
  return (
    <header className="md:hidden border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="px-4 h-14 flex items-center justify-between">
        <Link to="/app/dashboard"><CSLogo /></Link>
        <div className="flex items-center gap-2">
          <span className="mono text-[10px] uppercase text-muted-foreground">{roleLabel}</span>
          <NavCustomizer items={customizable} />
          <button onClick={onFocus} className="p-2 rounded-md text-muted-foreground" aria-label="Focus mode"><Maximize2 size={15} /></button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2" aria-label="Menu">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {mobileOpen && <div className="border-t border-border px-4 py-3 flex flex-col gap-2">{items.map((item) => <NavLink key={item.to} item={item} onClick={() => setMobileOpen(false)} />)}<div className="text-xs text-muted-foreground pt-1">{userEmail}</div><button onClick={onSignOut} className="btn-outline-brand text-xs py-1.5 px-3 mt-1"><LogOut size={12} /> Sign out</button></div>}
    </header>
  );
}