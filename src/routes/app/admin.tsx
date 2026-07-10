import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useUserRole } from "@/lib/useUserRole";
import { useAuth } from "@/lib/auth";
import { Loader2, FileText, ShoppingBag, Mail, BarChart3, Eye, Users } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  component: AdminLayout,
});

const TABS: { to: string; label: string; icon: typeof BarChart3; exact?: boolean }[] = [
  { to: "/app/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/app/admin/blog", label: "Blog", icon: FileText },
  { to: "/app/admin/store", label: "Store", icon: ShoppingBag },
  { to: "/app/admin/communities", label: "Communities", icon: Users },
  { to: "/app/admin/waitlist", label: "Waitlist", icon: Mail },
  { to: "/app/admin/preview", label: "Plan Preview", icon: Eye },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !roleLoading && (!user || !isAdmin)) {
      navigate({ to: "/app/dashboard" });
    }
  }, [user, isAdmin, loading, roleLoading, navigate]);

  if (loading || roleLoading || !isAdmin) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-brand" size={20} /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage content, view stats, preview plans.</p>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border mb-6 -mx-1">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: exact ?? false }}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent flex items-center gap-1.5 -mb-px transition-colors"
            activeProps={{ className: "px-3 py-2 text-sm text-foreground border-b-2 border-brand flex items-center gap-1.5 -mb-px font-medium" }}
          >
            <Icon size={14} /> {label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
