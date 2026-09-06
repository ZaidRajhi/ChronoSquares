import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useDelivery, type DeliveryRole } from "@/lib/delivery";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/preview")({
  component: AdminPreview,
});

const PLANS = [
  { value: "free", label: "Free", desc: "Shared delivery workspace with onboarding, projects, and files." },
  { value: "starter", label: "Starter", desc: "Expanded delivery workspaces with shared progress and approvals." },
  { value: "pro", label: "Pro", desc: "Advanced permissions, reporting, integrations, and AI usage." },
  { value: "team", label: "Team", desc: "Pro plus organisation-wide collaboration and role management." },
];

const ROLE_PREVIEWS: { value: DeliveryRole; label: string; title: string; description: string }[] = [
  { value: "provider", label: "Provider", title: "Provider control room", description: "See all client relationships, internal work, approvals, finance, and workspace setup." },
  { value: "client", label: "Client", title: "A clear view of your work", description: "See client-visible projects, shared updates, approvals, intake, and invoices." },
  { value: "contractor", label: "Contractor", title: "Your assigned delivery work", description: "See the projects and tasks shared with a contractor role." },
  { value: "stakeholder", label: "Stakeholder", title: "A focused project view", description: "See the client-visible progress and decisions relevant to a stakeholder." },
];

function AdminPreview() {
  const { user } = useAuth();
  const delivery = useDelivery();
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewRole, setPreviewRole] = useState<DeliveryRole>("provider");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("testing_plan, plan").eq("id", user.id).single();
      setCurrent(data?.testing_plan || data?.plan || "free");
      setLoading(false);
    })();
  }, [user]);

  const setPlan = async (plan: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ testing_plan: plan }).eq("id", user.id);
    setCurrent(plan);
    toast.success(`Previewing as ${plan}`);
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-5">
          Switch the plan used by the admin preview — useful for testing how each tier looks and behaves.
          Your real billing plan is unaffected.
        </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {PLANS.map((p) => {
          const active = current === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setPlan(p.value)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                active ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-border hover:border-brand/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.label}</span>
                {active && <span className="text-xs text-brand">Active</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{p.desc}</p>
            </button>
          );
        })}
      </div>
      </div>

      <div className="border-t border-border pt-7">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold">Delivery view preview</h2>
            <p className="text-sm text-muted-foreground mt-1">Preview role-specific navigation and visibility without changing your real membership or permissions.</p>
          </div>
          <span className="mono text-[10px] uppercase tracking-wider text-brand">Admin only</span>
        </div>
        <div className="grid sm:grid-cols-4 gap-2">
          {ROLE_PREVIEWS.map((role) => (
            <button key={role.value} onClick={() => setPreviewRole(role.value)} className={`text-left rounded-lg border px-3 py-2.5 text-xs transition-colors ${previewRole === role.value ? "border-brand bg-brand/5 text-brand" : "border-border text-muted-foreground hover:border-brand/50"}`}>
              <div className="font-medium">{role.label}</div>
              <div className="mt-1 text-[10px] opacity-75">{role.value === "provider" ? "Full workspace" : "Scoped view"}</div>
            </button>
          ))}
        </div>
        {(() => {
          const selected = ROLE_PREVIEWS.find((role) => role.value === previewRole) ?? ROLE_PREVIEWS[0];
          const visibleProjects = previewRole === "provider" ? delivery.projects : delivery.projects.filter((project) => project.client_visible).slice(0, 1);
          return (
            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mono text-[10px] uppercase tracking-wider text-brand">{selected.label} preview</div>
                  <h3 className="text-lg font-semibold mt-1">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">{selected.description}</p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2 text-right shrink-0">
                  <div className="mono text-[10px] uppercase text-muted-foreground">Visible projects</div>
                  <div className="text-lg font-semibold">{visibleProjects.length}</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-2 mt-5">
                {["Onboarding", "Project", "Communication", "Finance", "Files"].map((item) => <div key={item} className="rounded-lg border border-border/70 px-3 py-2 text-xs text-muted-foreground">{item}</div>)}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Previewing <span className="text-foreground font-medium">{delivery.organization.name || "an empty workspace"}</span> with a read-only role projection. No account role was changed.
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
