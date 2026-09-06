import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, Building2, Check, ChevronsUpDown, CircleHelp, Loader2, LockKeyhole, Plus } from "lucide-react";
import { CSLogo } from "@/components/CSLogo";
import { useDelivery } from "@/lib/delivery";

export const deliveryNav = [
  { slug: "onboarding", label: "Onboarding", icon: "01", description: "Intake, documents, and handover" },
  { slug: "project", label: "Project", icon: "02", description: "Milestones, tasks, and progress" },
  { slug: "communication", label: "Communication", icon: "03", description: "Updates, decisions, and approvals" },
  { slug: "finance", label: "Finance", icon: "04", description: "Costs, invoices, and status" },
  { slug: "files", label: "Files", icon: "05", description: "Shared documents and versions" },
] as const;

export const upcomingSquares = [
  { label: "Lead", icon: "↗", description: "Coming after MVP" },
  { label: "Care", icon: "♡", description: "Coming after MVP" },
];

export function DeliveryPage({ children, eyebrow, title, description, action }: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { source } = useDelivery();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="mono text-[10px] uppercase tracking-[0.18em] text-brand mb-2">{eyebrow}</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
        </div>
        {action}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SpaceSwitcher />
        {deliveryNav.map((item) => (
          <Link
            key={item.slug}
            to={`/app/${item.slug}`}
            className="mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-brand hover:border-brand/40 transition-colors"
            activeProps={{ className: "mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-md border border-brand/50 text-brand bg-brand/10" }}
          >
            {item.label}
          </Link>
        ))}
        <span className="text-[10px] text-muted-foreground ml-auto hidden md:block">{source === "supabase" ? "Connected" : ""}</span>
      </div>
      {children}
    </div>
  );
}

export function RoleSwitcher() {
  const { role } = useDelivery();
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  return <span className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{label} view</span>;
}

export function StatCard({ label, value, detail, tone = "default", icon }: { label: string; value: string | number; detail: string; tone?: "default" | "brand" | "warning"; icon?: ReactNode }) {
  return (
    <div className="module p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        {icon && <div className={`size-8 rounded-lg flex items-center justify-center ${tone === "brand" ? "bg-brand/10 text-brand" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{icon}</div>}
      </div>
      <div className={`text-2xl font-semibold mt-3 ${tone === "brand" ? "text-brand" : tone === "warning" ? "text-warning" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{detail}</div>
    </div>
  );
}

export function SectionCard({ label, meta, children, className = "" }: { label: string; meta?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`module ${className}`}>
      <div className="module-header"><span>{label}</span>{meta && <span className="text-muted-foreground/70">{meta}</span>}</div>
      <div className="module-body">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = status === "complete" || status === "paid" || status === "approved" || status === "received" ? "brand" : status === "review" || status === "pending" || status === "sent" || status === "in_progress" || status === "active" ? "violet" : status === "overdue" || status === "blocked" || status === "changes_requested" ? "warning" : "muted";
  return <span className={tone === "brand" ? "badge-soft" : tone === "violet" ? "badge-violet" : tone === "warning" ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/25" : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"}>{status.replaceAll("_", " ")}</span>;
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return <div className={`h-2 rounded-full bg-muted overflow-hidden ${className}`}><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="border border-dashed border-border rounded-xl px-5 py-8 text-center"><CircleHelp size={20} className="mx-auto text-muted-foreground/60 mb-2" /><div className="text-sm font-medium">{title}</div><p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function LoadingState() {
  return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 size={18} className="animate-spin mr-2" /> Loading workspace</div>;
}

export function AccessNote({ children }: { children: ReactNode }) {
  return <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/20"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-brand" />{children}</div>;
}

export function ActionLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline">{children}<ArrowRight size={14} /></Link>;
}

export function Checkmark({ checked }: { checked: boolean }) {
  return <span className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${checked ? "bg-brand border-brand text-brand-foreground" : "border-border text-transparent"}`}><Check size={12} /></span>;
}

export function AlertText({ children }: { children: ReactNode }) {
  return <div className="flex items-start gap-2 text-xs text-warning"><AlertCircle size={14} className="mt-0.5 shrink-0" />{children}</div>;
}

// A person can be a provider in one space and a client in another. This is how
// they move between every workspace they can act in, across organisations.
export function SpaceSwitcher() {
  const { spaces, activeSpace, setActiveSpace, isPreview } = useDelivery();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  if (isPreview) {
    return <span className="inline-flex items-center gap-1.5 rounded-md border border-brand/40 bg-brand/5 px-2.5 py-1.5 text-xs text-brand mr-1"><Building2 size={12} /> Preview · {activeSpace?.organizationName} / {activeSpace?.workspaceName}</span>;
  }
  if (!activeSpace) return <span className="text-xs text-muted-foreground mr-1">Workspace setup</span>;

  const canAddWorkspace = spaces.some((space) => space.role === "provider");
  const groups: { orgId: string; orgName: string; items: typeof spaces }[] = [];
  for (const space of spaces) {
    let group = groups.find((entry) => entry.orgId === space.organizationId);
    if (!group) { group = { orgId: space.organizationId, orgName: space.organizationName, items: [] }; groups.push(group); }
    group.items.push(space);
  }

  return (
    <div className="relative mr-1">
      <button onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:border-brand/40 transition-colors max-w-[260px]">
        <Building2 size={12} className="text-brand shrink-0" />
        <span className="font-medium truncate">{activeSpace.workspaceName}</span>
        <span className="text-muted-foreground truncate hidden sm:inline">· {activeSpace.organizationName}</span>
        <span className="mono text-[9px] uppercase text-muted-foreground shrink-0">{activeSpace.role}</span>
        <ChevronsUpDown size={12} className="text-muted-foreground shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 w-72 rounded-lg border border-border bg-card p-1 shadow-lg">
            {groups.map((group) => (
              <div key={group.orgId} className="py-1">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{group.orgName}</div>
                {group.items.map((space) => (
                  <button key={space.workspaceId} onClick={() => { setActiveSpace(space.workspaceId); setOpen(false); }} className={`w-full text-left rounded-md px-2 py-1.5 text-xs flex items-center justify-between gap-2 ${space.workspaceId === activeSpace.workspaceId ? "bg-brand/10 text-brand" : "hover:bg-muted"}`}>
                    <span className="truncate">{space.workspaceName}</span>
                    <span className="mono text-[9px] uppercase opacity-70 shrink-0">{space.role}</span>
                  </button>
                ))}
              </div>
            ))}
            {canAddWorkspace && (
              <button onClick={() => { setOpen(false); setAdding(true); }} className="w-full text-left rounded-md px-2 py-2 mt-1 text-xs flex items-center gap-1.5 hover:bg-muted border-t border-border text-brand">
                <Plus size={12} /> New workspace
              </button>
            )}
          </div>
        </>
      )}
      {adding && <NewWorkspaceModal onClose={() => setAdding(false)} />}
    </div>
  );
}

function NewWorkspaceModal({ onClose }: { onClose: () => void }) {
  const { spaces, addWorkspace } = useDelivery();
  const providerOrgs: { id: string; name: string }[] = [];
  for (const space of spaces) {
    if (space.role === "provider" && !providerOrgs.some((entry) => entry.id === space.organizationId)) {
      providerOrgs.push({ id: space.organizationId, name: space.organizationName });
    }
  }
  const [organizationId, setOrganizationId] = useState(providerOrgs[0]?.id ?? "");
  const [workspaceName, setWorkspaceName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await addWorkspace({ organizationId, workspaceName, clientName, clientCompany, clientEmail: "" });
      toast.success("Workspace created.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't create the workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form className="module max-w-sm w-full p-5 space-y-3" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <h3 className="font-semibold">New workspace</h3>
        {providerOrgs.length > 1 && (
          <label className="block">
            <span className="text-xs font-medium">Organisation</span>
            <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm">
              {providerOrgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </label>
        )}
        <label className="block">
          <span className="text-xs font-medium">Workspace name</span>
          <input required minLength={2} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Acme website launch" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium">Client name <span className="text-muted-foreground font-normal">(optional)</span></span>
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium">Company <span className="text-muted-foreground font-normal">(optional)</span></span>
            <input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
          <button type="submit" disabled={saving} className="btn-brand text-xs py-1.5 px-3">{saving ? "Creating..." : "Create workspace"}</button>
        </div>
      </form>
    </div>
  );
}

/**
 * First-run provider setup. Shown on its own — no app nav or chrome — until the
 * person has created an organisation and their first workspace.
 */
export function ProviderSetupScreen() {
  const { createProviderWorkspace } = useDelivery();
  const navigate = useNavigate();
  const [organizationName, setOrganizationName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createProviderWorkspace({ organizationName, workspaceName, clientName, clientCompany, clientEmail });
      toast.success("Your workspace is ready.");
      navigate({ to: "/app/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't create your workspace.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-8"><CSLogo /></Link>
      <div className="w-full max-w-xl">
        <div className="text-center mb-7">
          <div className="mono text-[10px] uppercase tracking-[0.18em] text-brand mb-2">Set up your delivery workspace</div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Create your first workspace</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Name your organisation and your first client workspace. That's all you need to start — clients,
            contractors, and stakeholders are invited whenever you're ready.
          </p>
        </div>
        <div className="module p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium">Your organisation</span>
                <input required minLength={2} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="FlowGrid Studio" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
                <span className="text-[10px] text-muted-foreground mt-1 block">Your agency or studio. You are its provider.</span>
              </label>
              <label className="block">
                <span className="text-xs font-medium">First workspace name</span>
                <input required minLength={2} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Acme website launch" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
                <span className="text-[10px] text-muted-foreground mt-1 block">One engagement or client. You can add more later.</span>
              </label>
            </div>
            <div className="border-t border-border pt-5">
              <div className="text-sm font-medium">Client details <span className="text-muted-foreground font-normal">— optional</span></div>
              <p className="text-xs text-muted-foreground mt-1">Add the client now if you have their details, or leave this blank and invite them from the workspace later.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-medium">Client name</span>
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Client contact name" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Company</span>
                <input value={clientCompany} onChange={(event) => setClientCompany(event.target.value)} placeholder="Client company" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium">Client email</span>
              <input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="client@example.com" className="w-full mt-1.5 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <button type="submit" disabled={saving} className="btn-brand w-full justify-center">{saving ? "Creating..." : "Create workspace"}</button>
            <p className="text-[10px] text-muted-foreground text-center">Creates your organisation, your provider membership, the workspace, and its kickoff intake.</p>
          </form>
        </div>
      </div>
    </div>
  );
}