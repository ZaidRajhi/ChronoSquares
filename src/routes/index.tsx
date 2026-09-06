import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
import { WaitlistForm } from "@/components/public/WaitlistForm";
import { fetchLatestArticles } from "@/lib/chronoblog";
import {
  Activity, Clock, CheckSquare, Target, BookOpen, Wallet,
  Users, Inbox, ArrowRight, Sparkles, Zap, Workflow, Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async () => ({ articles: await fetchLatestArticles(3) }),
  head: () => ({
    meta: [
      { title: "ChronoSquares — Client delivery, squared up." },
      {
        name: "description",
        content:
          "ChronoSquares is a shared client-delivery platform. One workspace for your agency, clients, and partners.",
      },
      { property: "og:title", content: "ChronoSquares — Client delivery, squared up." },
      {
        property: "og:description",
        content: "One shared workspace for onboarding, projects, communication, finance, and files.",
      },
    ],
  }),
  component: HomePage,
});

const SQUARES = [
  { icon: Inbox, name: "Lead", desc: "Capture enquiries, discovery, proposals, and quotations in one place." },
  { icon: Activity, name: "Onboarding", desc: "Move from accepted proposal to a ready-to-run client workspace." },
  { icon: Clock, name: "Project", desc: "Keep milestones, tasks, deadlines, and progress in one shared view." },
  { icon: CheckSquare, name: "Communication", desc: "Capture updates, decisions, questions, and approvals beside the work." },
  { icon: Target, name: "Finance", desc: "Track agreed costs, invoice line items, and payment status." },
  { icon: BookOpen, name: "Files", desc: "Share contracts, assets, working documents, versions, and deliverables." },
  { icon: Wallet, name: "Care", desc: "Support, renew, and grow the relationship after delivery." },
];

const ADDONS = [
  {
    icon: Users,
    name: "People and permissions",
    desc: "Bring clients, contractors, partners, and stakeholders into the right part of the work.",
  },
  {
    icon: Workflow,
    name: "Connected tools",
    desc: "Keep the tools a business already needs connected to the service-delivery system.",
  },
  {
    icon: Sparkles,
    name: "FlowGrid implementation",
    desc: "Get help designing, building, and improving a delivery system around a real business.",
  },
];

function HomePage() {
  const { articles } = Route.useLoaderData();
  return (
    <PublicShell>
      {/* HERO */}
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center relative">
          <span className="badge-soft mb-6">In Development · 2026</span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Own Your Hours,
            <br />
            <span className="text-gradient">Square Them Up.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A shared client-delivery workspace for agencies, clients, and partners.
            Keep onboarding, delivery, decisions, costs, and files together.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-brand">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <a href="#squares" className="btn-outline-brand">Explore the App</a>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-wider text-muted-foreground/70">
              <span>7 Squares</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Client workspaces</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Role-based access</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Clear handovers</span>
          </div>
        </div>
      </section>

      {/* THREE PILLARS — establish the system right after the hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
             One workspace. <span className="text-gradient">The whole service.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            ChronoSquares keeps the full client relationship in one reliable source of truth.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="hover-tile p-7">
            <div className="w-11 h-11 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-5">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">Shared delivery</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Seven focused areas cover the service lifecycle, from onboarding to delivery and
              the next engagement.
            </p>
          </div>
          <div className="hover-tile p-7">
            <div className="w-11 h-11 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-5">
              <Workflow size={20} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">Role-based views</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Providers see the whole operation. Clients see their work. Contractors and
              stakeholders see only what they need.
            </p>
          </div>
          <div className="hover-tile p-7 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06] bg-gradient-to-br from-brand to-accent pointer-events-none" />
            <div className="relative">
              <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent flex items-center justify-center mb-5">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Calm handovers <span className="badge-violet">Built-in</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                From an intake submission to a milestone approval, the right person gets the
                right next step without another chasing email.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-divider" />

      {/* THE 7 SQUARES */}
      <section id="squares" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge-soft mb-4">Layer 1 · Squares</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">The 7 Squares</h2>
          <p className="mt-4 text-muted-foreground">Seven core modules — each focused, each connected.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SQUARES.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="hover-tile p-6 group">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-brand/20 to-accent/30 text-brand flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="glow-divider" />

       {/* WORKFLOW LAYER + AI ARCHITECT — paired feature */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-5 gap-5">
          <div className="hover-tile p-8 sm:p-10 lg:col-span-2">
             <span className="badge-soft mb-4">The operating layer</span>
            <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-5 mt-2">
              <Workflow size={22} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Workflow Layer</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Connect the Squares and move information through the service lifecycle. Trigger
              forms, tasks, reminders, approvals, and status changes without rebuilding the same
              process for every client.
            </p>
          </div>
          <div className="hover-tile p-8 sm:p-10 lg:col-span-3 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{ background: "radial-gradient(circle at 70% 30%, var(--brand), transparent 60%)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                 <span className="badge-soft">The intelligence layer</span>
                 <span className="badge-violet">Built for providers</span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center mb-5 mt-2">
                <Zap size={22} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Architect</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                Configure and operate your service systems with plain language. Generate
                onboarding checklists, milestones, client updates, and useful summaries of risks,
                decisions, and overdue actions.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="badge-soft">Build workflows</span>
                <span className="badge-soft">Generate checklists</span>
                <span className="badge-soft">Summarise delivery</span>
                <span className="badge-soft">Find context</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-divider" />

       {/* VISIBILITY & EXTENSIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Make It Yours</h2>
          <p className="mt-4 text-muted-foreground">
             Give every person the right context and keep the relationship ready for what comes next.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="hover-tile p-8">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Role-based access</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Providers see the operation. Clients see their projects. Contractors and stakeholders
              see only their assigned slice.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Provider", "Client", "Contractor", "Stakeholder"].map((role) => (
                <span key={role} className="badge-soft">{role}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Built for repeat work</h3>
            <div className="grid gap-4">
              {ADDONS.map(({ icon: Icon, name, desc }) => (
                <div key={name} className="hover-tile p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-semibold">{name}</h4>
                         <span className="badge-violet">Next</span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="glow-divider" />

      {/* CHRONOBLOG */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">ChronoBlog</h2>
          <p className="mt-4 text-muted-foreground">
             Practical thinking for calmer client delivery and better working relationships.
          </p>
        </div>
        {articles.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {articles.map((a) => (
              <Link
                key={a.slug}
                to="/chronoblog/$slug"
                params={{ slug: a.slug }}
                className="hover-tile p-6 block"
              >
                <h3 className="text-lg font-semibold tracking-tight">{a.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-brand">
                  Read more <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link to="/chronoblog" className="btn-outline-brand text-sm">View All Articles</Link>
        </div>
      </section>

      <div className="glow-divider" />

       {/* RESOURCES + FLOWGRID — combined "while you wait" row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-soft mb-4">In the meantime</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Start Today</h2>
          <p className="mt-4 text-muted-foreground">
             Useful resources for agencies building a more reliable delivery operation.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="hover-tile p-8 sm:p-10">
            <h3 className="text-2xl font-bold tracking-tight">Notion Templates</h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">
               Useful Notion productivity templates for planning, organisation, projects, and focused work
               done — independent of the ChronoSquares platform.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link to="/store" className="btn-brand text-sm">Browse Store</Link>
              <a
                href="https://www.notion.so/marketplace"
                target="_blank"
                rel="noreferrer"
                className="btn-outline-brand text-sm"
              >
                Notion Marketplace
              </a>
            </div>
          </div>
          <div className="hover-tile p-8 sm:p-10">
             <span className="badge-violet mb-4">ChronoSquares</span>
             <h3 className="mt-2 text-2xl font-bold tracking-tight">A better kickoff</h3>
             <p className="mt-1 text-sm text-muted-foreground">Onboarding that leads to delivery</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
               Start with an intake, collect the right documents, record agreement and payment
               status, and move into a shared project without rebuilding the relationship.
            </p>
            <Link to="/flowgrid" className="mt-6 inline-flex btn-outline-brand text-sm">
               Explore the workflow <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <div className="glow-divider" />

      {/* PLANS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Plans</h2>
          <p className="mt-4 text-muted-foreground">
            Three tiers. Pricing finalised at launch — early waitlist gets locked-in rates.
          </p>
        </div>
        <PlansGrid />
        <p className="mt-8 text-center text-sm text-muted-foreground">
           The MVP starts with onboarding through files. Lead and Care complete the broader
           service lifecycle as the platform grows.
        </p>
      </section>

      <div className="glow-divider" />

      {/* WAITLIST */}
      <section id="waitlist" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Be First In</h2>
          <p className="mt-4 text-muted-foreground">
             ChronoSquares is in development. Join the waitlist for early access and delivery updates.
          </p>
          <div className="mt-10">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

const PLANS: {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  highlight?: boolean;
  features: string[];
}[] = [
  {
    name: "Free",
    price: "£0",
    cadence: "forever",
     tagline: "A clear starting point for one client relationship.",
    features: [
       "Shared project workspace",
       "Intake and document collection",
       "Milestones, updates, and approvals",
       "Basic invoice status tracking",
    ],
  },
  {
     name: "Studio",
    price: "£TBD",
    cadence: "/month",
     tagline: "For agencies running active client delivery.",
    highlight: true,
    features: [
       "Multiple client workspaces",
       "Onboarding-to-delivery handover",
       "Role-based client and partner access",
       "Shared files, approvals, and updates",
       "Basic costs and invoice line items",
       "Project history that persists for repeat work",
    ],
  },
  {
    name: "Business",
    price: "£TBD",
    cadence: "/month",
     tagline: "For teams coordinating providers, clients, and partners.",
    features: [
       "Everything in Studio",
       "Provider, client, contractor, and stakeholder roles",
       "Internal vs shared visibility rules",
       "Organisation-level client oversight",
       "Approval and onboarding notifications",
       "SSO + role management",
    ],
  },
];

function PlansGrid() {
  return (
    <div className="mt-12 grid md:grid-cols-3 gap-5 items-stretch">
      {PLANS.map((p) => (
        <div
          key={p.name}
          className={`hover-tile p-7 flex flex-col relative overflow-hidden ${
            p.highlight ? "border-brand/60 shadow-[var(--shadow-glow)]" : ""
          }`}
        >
          {p.highlight && (
            <>
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{ background: "radial-gradient(circle at 70% 0%, var(--brand), transparent 60%)" }}
              />
              <span className="absolute top-4 right-4 badge-violet">Most Popular</span>
            </>
          )}
          <div className="relative">
            <h3 className="text-xl font-semibold tracking-tight">{p.name}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.tagline}</p>
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.cadence}</span>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground">
                  <Check size={14} className="text-brand mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={`mt-7 ${p.highlight ? "btn-brand" : "btn-outline-brand"} text-sm w-full justify-center`}
            >
              {p.name === "Free" ? "Start Free" : "Join Waitlist"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
