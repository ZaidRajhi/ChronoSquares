import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Check, CircleHelp, Loader2, LockKeyhole } from "lucide-react";
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
  const { source, role, organization } = useDelivery();
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
        <span className="text-xs text-muted-foreground mr-1">{organization.name || "Workspace setup"}</span>
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