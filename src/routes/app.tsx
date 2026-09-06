import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/lib/useUserRole";
import { AppShell } from "@/components/app/AppShell";
import { DeliveryProvider, useDelivery } from "@/lib/delivery";
import { Loader2 } from "lucide-react";
import { LoadingState } from "@/components/delivery/DeliveryShell";

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

function DeliveryGate() {
  const { needsSetup, loading: deliveryLoading, loadError } = useDelivery();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith("/app/admin");
    if (!deliveryLoading && !roleLoading && needsSetup && !isAdminRoute && location.pathname !== "/app/onboarding") {
      navigate({ to: "/app/onboarding" });
    }
  }, [deliveryLoading, roleLoading, needsSetup, isAdmin, location.pathname, navigate]);

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

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
