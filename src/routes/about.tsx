import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ChronoSquares" },
      { name: "description", content: "ChronoSquares is a shared client-delivery platform for service businesses." },
      { property: "og:title", content: "About — ChronoSquares" },
      {
        property: "og:description",
        content: "ChronoSquares is a shared client-delivery platform for service businesses.",
      },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { title: "Clarity", desc: "Make responsibilities, progress, costs, and decisions visible to the right people." },
  { title: "Consistency", desc: "Replace repeated manual handovers with dependable service-delivery systems." },
  { title: "Professional trust", desc: "Give clients a reassuring experience without exposing private provider operations." },
];

const TIMELINE = [
  { when: "ChronoSquares", what: "The shared platform for providers, clients, contractors, and stakeholders." },
  { when: "FlowGrid", what: "The implementation and consulting service that designs delivery systems around real businesses." },
  { when: "Product loop", what: "Proven implementation patterns become repeatable ChronoSquares features." },
];

function AboutPage() {
  return (
    <PublicShell>
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">About ChronoSquares</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
             The operating system for service delivery.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Mission</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
           ChronoSquares helps service businesses reclaim time through a seamless client intake and
           service-delivery system. It brings tasks, contracts, costs, updates, and every involved
           party into one organised place.
        </p>

        <h2 className="mt-12 text-2xl font-bold tracking-tight">What We're Building</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
           ChronoSquares is a shared client-delivery platform for service-based agencies. The seven
           Squares follow the full relationship: Lead, Onboarding, Project, Communication, Finance,
           Files, and Care. Providers manage the detailed operation while clients and partners see
           the work, information, and actions relevant to them.
        </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The initial MVP focuses on onboarding through delivery: intake, documents, milestones,
            tasks, approvals, updates, files, and basic invoice tracking. The Workflow Layer and AI
            Architect are part of the wider platform direction.
          </p>
      </section>

      <div className="glow-divider" />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Values</h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-5">
          {VALUES.map((v) => (
            <div key={v.title} className="hover-tile p-6">
              <h3 className="text-lg font-semibold tracking-tight">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="glow-divider" />

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Timeline</h2>
        <ol className="mt-8 space-y-6">
          {TIMELINE.map((t) => (
            <li key={t.when} className="hover-tile p-5 grid sm:grid-cols-[140px_1fr] gap-3 items-start">
              <span className="text-brand font-semibold">{t.when}</span>
              <span className="text-muted-foreground">{t.what}</span>
            </li>
          ))}
        </ol>
      </section>
    </PublicShell>
  );
}
