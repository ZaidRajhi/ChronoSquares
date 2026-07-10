import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
import { FlowgridWaitlistForm } from "@/components/public/FlowgridWaitlistForm";
import { Workflow, Zap, BarChart3, Plug } from "lucide-react";

export const Route = createFileRoute("/flowgrid")({
  head: () => ({
    meta: [
      { title: "FlowGrid — Automated Agency Onboarding" },
      {
        name: "description",
        content:
          "Infrastructure to automate client intake and operational workflows. Transform your agency's onboarding from manual chaos to streamlined automation.",
      },
      { property: "og:title", content: "FlowGrid — Automated Agency Onboarding" },
      {
        property: "og:description",
        content: "Automate client intake, contracts, task setup, and welcome flows — end to end.",
      },
    ],
  }),
  component: FlowgridPage,
});

const FEATURES = [
  {
    icon: Workflow,
    title: "Streamlined Intake",
    desc: "Automated forms and workflows that collect client information consistently, eliminating manual data entry and follow-up emails.",
  },
  {
    icon: Zap,
    title: "Operational Automation",
    desc: "Workflows that handle resource allocation, project setup, and team notifications automatically.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Visibility",
    desc: "Track onboarding progress in real-time with dashboards showing pipeline health, completion rates, and bottlenecks.",
  },
  {
    icon: Plug,
    title: "Tool Integration",
    desc: "Integrates with your existing stack — CRM, project management, communication tools, and more.",
  },
];

const REPLACES = [
  ["Email threads", "Automated intake flows"],
  ["Spreadsheets", "Real-time dashboards"],
  ["Manual setup", "Trigger-based task creation"],
  ["Human error", "Consistent, systematic delivery"],
];

function FlowgridPage() {
  return (
    <PublicShell>
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span className="badge-violet mb-5">Coming Soon 2026 — A ChronoSquares Service</span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">FlowGrid</h1>
          <p className="mt-4 text-lg text-muted-foreground">Automated Agency Onboarding</p>
          <p className="mt-6 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            Infrastructure to automate client intake and operational workflows. Transform your
            agency's onboarding from manual chaos to streamlined automation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight">Why FlowGrid?</h2>
        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="hover-tile p-6">
              <div className="w-10 h-10 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="glow-divider" />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight">What FlowGrid Replaces</h2>
        <div className="mt-10 grid gap-3">
          {REPLACES.map(([from, to]) => (
            <div key={from} className="hover-tile p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="text-muted-foreground line-through decoration-destructive/50">{from}</div>
              <div className="text-muted-foreground/50 text-center">→</div>
              <div className="text-foreground font-medium">{to}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="glow-divider" />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight">Pricing — Coming Soon</h2>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Pricing details will be released at launch. Join the waitlist for early access pricing.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="hover-tile p-10 sm:p-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Join the Waitlist</h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Be first to know when FlowGrid opens to agencies.
          </p>
          <div className="mt-8">
            <FlowgridWaitlistForm />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
