import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/lib/useUserRole";
import { AppShell } from "@/components/app/AppShell";
import { DeliveryProvider, useDelivery } from "@/lib/delivery";
import { Eye, Loader2 } from "lucide-react";
import { LoadingState, ProviderSetupScreen } from "@/components/delivery/DeliveryShell";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-brand" size={24} />
      </div>
    );
  }

  return (
    <DeliveryProvider>
      <DeliveryGate />
    </DeliveryProvider>
  );
}

function AdminPreviewBanner() {
  const { isPreview, preview, plan, stopPreview, activeSpace } = useDelivery();
  const navigate = useNavigate();
  if (!isPreview || !preview) return null;

  const exit = () => {
    stopPreview();
    navigate({ to: "/app/admin/preview" });
  };

  return (
    <div className="sticky top-0 z-[60] bg-brand text-brand-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Eye size={14} className="shrink-0" />
          <span className="font-semibold uppercase tracking-wide shrink-0">Admin preview</span>
          <span className="truncate opacity-90">
            Viewing as <span className="font-medium capitalize">{preview.role}</span> · plan{" "}
            <span className="font-medium capitalize">{plan}</span> ·{" "}
            {activeSpace?.organizationName ?? preview.organizationName} / {activeSpace?.workspaceName ?? preview.workspaceName} · read-only
          </span>
        </div>
        <button onClick={exit} className="shrink-0 rounded-md bg-brand-foreground/15 hover:bg-brand-foreground/25 px-2.5 py-1 font-medium transition-colors">
          Exit preview
        </button>
      </div>
    </div>
  );
}

function DeliveryGate() {
  const { needsSetup, loading: deliveryLoading, loadError, isPreview } = useDelivery();
  const { loading: roleLoading } = useUserRole();

  if (deliveryLoading || roleLoading) {
    return <LoadingState />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">We couldn’t load your workspace</h1>
          <p className="text-sm text-muted-foreground mt-2">Please refresh and try again. If the problem continues, contact your workspace administrator.</p>
        </div>
      </div>
    );
  }

  // First-run: no organisation yet. Show setup on its own — no app nav — until
  // an organisation and first workspace exist.
  if (needsSetup && !isPreview) {
    return <ProviderSetupScreen />;
  }

  return (
    <>
      <AdminPreviewBanner />
      <AppShell>
        <Outlet />
      </AppShell>
    </>
  );
}
