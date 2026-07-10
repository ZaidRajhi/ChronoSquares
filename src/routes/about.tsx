import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ChronoSquares" },
      { name: "description", content: "Precision tools for a more intentional life and business." },
      { property: "og:title", content: "About — ChronoSquares" },
      {
        property: "og:description",
        content: "Precision tools for a more intentional life and business.",
      },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { title: "Systems-Thinking", desc: "Small improvements compound into significant results." },
  { title: "Precision", desc: "Every feature built with intention. No noise." },
  { title: "Transparency", desc: "We build in the open. Your feedback shapes what we create." },
];

const TIMELINE = [
  { when: "Mid 2025", what: "Released first Notion templates." },
  { when: "2026", what: "ChronoSquares app in development." },
  { when: "2026+", what: "Full SaaS launch with 7 Squares, Overlays, and Add-on Squares." },
];

function AboutPage() {
  return (
    <PublicShell>
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">About ChronoSquares</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Precision tools for a more intentional life and business.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold tracking-tight">Mission</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Replace manual effort with automated systems. We believe the future belongs to those who
          systematise their work, not those who grind.
        </p>

        <h2 className="mt-12 text-2xl font-bold tracking-tight">What We're Building</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          ChronoSquares is a personal operating system — seven interconnected modules managing
          habits, tasks, goals, time, journal, media, and finances in one seamless workspace.
          Alongside the app, we build Notion templates, automation workflows, and bespoke agency
          services through FlowGrid.
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
