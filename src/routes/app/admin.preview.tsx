import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useDelivery, type DeliveryRole, type PlanId } from "@/lib/delivery";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/preview")({
  component: AdminPreview,
});

const PLANS: { value: PlanId; label: string; desc: string }[] = [
  {
    value: "free",
    label: "Free",
    desc: "One provider organisation with a single client workspace.",
  },
  {
    value: "starter",
    label: "Starter",
    desc: "A handful of client workspaces with shared progress and approvals.",
  },
  {
    value: "pro",
    label: "Pro",
    desc: "Advanced permissions, reporting, integrations, and AI usage.",
  },
  {
    value: "team",
    label: "Team",
    desc: "Pro plus organisation-wide collaboration and role management.",
  },
];

const ROLES: { value: DeliveryRole; label: string; note: string }[] = [
  { value: "provider", label: "Provider", note: "Full workspace" },
  { value: "client", label: "Client", note: "Shared view only" },
  { value: "contractor", label: "Contractor", note: "Assigned work" },
  { value: "stakeholder", label: "Stakeholder", note: "Progress + decisions" },
];

interface OrgRow {
  id: string;
  name: string;
}
interface WsRow {
  id: string;
  organization_id: string;
  name: string;
}

function AdminPreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { preview, isPreview, startPreview, stopPreview } = useDelivery();

  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [workspaces, setWorkspaces] = useState<WsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState<PlanId>("free");
  const [role, setRole] = useState<DeliveryRole>("provider");
  const [orgId, setOrgId] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const [profileRes, orgRes, wsRes] = await Promise.all([
        db.from("profiles").select("testing_plan, plan").eq("id", user.id).maybeSingle(),
        db.from("delivery_organizations").select("id, name").order("name"),
        db.from("delivery_workspaces").select("id, organization_id, name").order("name"),
      ]);
      if (cancelled) return;
      const startingPlan = (profileRes.data?.testing_plan ||
        profileRes.data?.plan ||
        "free") as string;
      if (["free", "starter", "pro", "team"].includes(startingPlan))
        setPlan(startingPlan as PlanId);
      const orgRows: OrgRow[] = orgRes.data ?? [];
      const wsRows: WsRow[] = wsRes.data ?? [];
      setOrgs(orgRows);
      setWorkspaces(wsRows);
      if (preview) {
        setRole(preview.role);
        setPlan(preview.plan);
        setOrgId(preview.organizationId);
        setWorkspaceId(preview.workspaceId);
      } else if (orgRows.length) {
        setOrgId(orgRows[0].id);
        setWorkspaceId(wsRows.find((w) => w.organization_id === orgRows[0].id)?.id ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, preview]);

  const orgWorkspaces = useMemo(
    () => workspaces.filter((w) => w.organization_id === orgId),
    [workspaces, orgId],
  );

  const applyPlan = async (next: PlanId) => {
    setPlan(next);
    if (user)
      await (
        supabase as unknown as {
          from: (t: string) => {
            update: (v: unknown) => { eq: (c: string, v: string) => Promise<unknown> };
          };
        }
      )
        .from("profiles")
        .update({ testing_plan: next })
        .eq("id", user.id);
  };

  const start = () => {
    const org = orgs.find((o) => o.id === orgId);
    const ws = orgWorkspaces.find((w) => w.id === workspaceId);
    if (!org || !ws) {
      toast.error("Pick an organisation and a workspace first.");
      return;
    }
    startPreview({
      role,
      plan,
      organizationId: org.id,
      organizationName: org.name,
      workspaceId: ws.id,
      workspaceName: ws.name,
    });
    toast.success(`Previewing ${org.name} / ${ws.name} as ${role}`);
    navigate({ to: "/app/dashboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">View the app as a provider or a client</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a plan, a role, and a real workspace. The app re-renders exactly as that person would
          see it, read-only, with a banner across the top. Your real account, role, and billing are
          untouched.
        </p>
      </div>

      {isPreview && preview && (
        <div className="rounded-xl border border-brand/40 bg-brand/5 p-4 flex items-start justify-between gap-4">
          <div className="text-sm">
            <div className="flex items-center gap-2 font-medium text-brand">
              <Eye size={15} /> Preview running
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {preview.organizationName} / {preview.workspaceName} · as {preview.role} · plan{" "}
              {preview.plan}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigate({ to: "/app/dashboard" })}
              className="btn-outline-brand text-xs py-1.5 px-3"
            >
              Open
            </button>
            <button onClick={stopPreview} className="btn-brand text-xs py-1.5 px-3">
              Exit preview
            </button>
          </div>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold mb-3">Plan</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {PLANS.map((p) => {
            const active = plan === p.value;
            return (
              <button
                key={p.value}
                onClick={() => applyPlan(p.value)}
                className={`text-left p-4 rounded-xl border transition-colors ${active ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-border hover:border-brand/50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.label}</span>
                  {active && <span className="text-xs text-brand">Selected</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Role</h3>
        <div className="grid sm:grid-cols-4 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`text-left rounded-lg border px-3 py-2.5 text-xs transition-colors ${role === r.value ? "border-brand bg-brand/5 text-brand" : "border-border text-muted-foreground hover:border-brand/50"}`}
            >
              <div className="font-medium">{r.label}</div>
              <div className="mt-1 text-[10px] opacity-75">{r.note}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-3">Workspace</h3>
        {orgs.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-4">
            No delivery workspaces exist yet. Create one from onboarding, or wait for a provider to
            set theirs up, then preview it here.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium">Organisation</span>
              <select
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value);
                  setWorkspaceId(
                    workspaces.find((w) => w.organization_id === e.target.value)?.id ?? "",
                  );
                }}
                className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium">Workspace</span>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm"
              >
                {orgWorkspaces.length === 0 && (
                  <option value="">No workspaces in this organisation</option>
                )}
                {orgWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <button onClick={start} disabled={!workspaceId} className="btn-brand disabled:opacity-50">
          <Eye size={14} /> Start preview
        </button>
        <span className="text-xs text-muted-foreground">
          Opens the dashboard as the selected role.
        </span>
      </div>
    </div>
  );
}
