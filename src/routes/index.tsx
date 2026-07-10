import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
import { WaitlistForm } from "@/components/public/WaitlistForm";
import {
  Activity, Clock, CheckSquare, Target, BookOpen, Film, Wallet,
  Sword, Users, Inbox, ArrowRight, Sparkles, Zap, Workflow, Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChronoSquares — Own Your Hours. Square Them Up." },
      {
        name: "description",
        content:
          "ChronoSquares is a personal operating system. Seven interconnected modules. One seamless workspace. Your life, systematised.",
      },
      { property: "og:title", content: "ChronoSquares — Own Your Hours. Square Them Up." },
      {
        property: "og:description",
        content: "Seven interconnected productivity modules. One seamless workspace. Your life, systematised.",
      },
    ],
  }),
  component: HomePage,
});

const SQUARES = [
  { icon: Activity, name: "Habits", desc: "Track what you do daily. See what it builds." },
  { icon: Clock, name: "Time", desc: "See where your hours go. Optimise what you can't see." },
  { icon: CheckSquare, name: "Tasks", desc: "Capture everything. Surface what matters today." },
  { icon: Target, name: "Goals", desc: "Set targets. Connect them to habits and tasks. Watch progress happen." },
  { icon: BookOpen, name: "Journal", desc: "Write daily. Your entries informed by your data." },
  { icon: Film, name: "Media", desc: "Track what you're reading, watching, and learning." },
  { icon: Wallet, name: "Finance", desc: "Log income and spending. See your financial picture clearly." },
];

const ADDONS = [
  {
    icon: Sword,
    name: "Gamification",
    desc: "Turn tasks into quests. Goals into campaigns. Adds a Dungeon Square and transforms how Tasks and Goals work.",
  },
  {
    icon: Users,
    name: "Team Tasks",
    desc: "Bring collaborators in. Assign tasks, track progress together.",
  },
  {
    icon: Inbox,
    name: "Email",
    desc: "Bring your inbox into ChronoSquares. Read, triage, and act without leaving.",
  },
];

const ARTICLES = [
  {
    slug: "habit-tracking",
    title: "Habit Tracking That Actually Works",
    excerpt:
      "Discover the science behind effective habit tracking and how intelligent analytics can reveal patterns in your behaviour.",
  },
  {
    slug: "time-management",
    title: "The Science of Time Management",
    excerpt:
      "Learn how to optimise your energy and attention instead of just managing hours.",
  },
  {
    slug: "productivity-logic",
    title: "Productivity Logic: Building Systems, Not Willpower",
    excerpt:
      "Explore how to replace willpower with intelligence. Better systems, not stronger determination.",
  },
];

function HomePage() {
  return (
    <PublicShell>
      {/* HERO */}
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center relative">
          <span className="badge-soft mb-6">In Development · 2026</span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Own Your Hours.
            <br />
            <span className="text-gradient">Square Them Up.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A personal operating system. Seven interconnected modules, one intelligent workspace,
            an AI Architect that builds it around you.
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
            <span>Workflow Layer</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>AI Architect</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Overlays</span>
          </div>
        </div>
      </section>

      {/* THREE PILLARS — establish the system right after the hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            One workspace. <span className="text-gradient">Three layers.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            ChronoSquares isn't a tool. It's a system — modules, connections, and an architect.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="hover-tile p-7">
            <div className="w-11 h-11 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-5">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">Squares</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Seven purpose-built modules — habits, time, tasks, goals, journal, media, finance.
              Toggle what you need.
            </p>
          </div>
          <div className="hover-tile p-7">
            <div className="w-11 h-11 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-5">
              <Workflow size={20} />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">Workflow Layer</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The connective tissue. Data flows between Squares — complete a habit, update a goal,
              trigger an alert.
            </p>
          </div>
          <div className="hover-tile p-7 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06] bg-gradient-to-br from-brand to-accent pointer-events-none" />
            <div className="relative">
              <div className="w-11 h-11 rounded-lg bg-accent/15 text-accent flex items-center justify-center mb-5">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                AI Architect <span className="badge-violet">Built-in</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your assistant that builds layouts, writes automations, and answers anything —
                without leaving the app.
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
            <span className="badge-soft mb-4">Layer 2</span>
            <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center mb-5 mt-2">
              <Workflow size={22} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Workflow Layer</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A connectivity engine. Build automations in plain language.
              Complete a habit → update a goal. Log a transaction → trigger a budget alert.
              The logic lives between your Squares.
            </p>
          </div>
          <div className="hover-tile p-8 sm:p-10 lg:col-span-3 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{ background: "radial-gradient(circle at 70% 30%, var(--brand), transparent 60%)" }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <span className="badge-soft">Layer 3</span>
                <span className="badge-violet">The brain of ChronoSquares</span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/15 text-accent flex items-center justify-center mb-5 mt-2">
                <Zap size={22} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Architect</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                Ask it to build your layout, generate automations, search the web, or answer any
                question. It knows your Squares, reads your data, and acts on your behalf — all
                inside ChronoSquares.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="badge-soft">Build my layout</span>
                <span className="badge-soft">Automate this</span>
                <span className="badge-soft">Summarise my week</span>
                <span className="badge-soft">Search the web</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="glow-divider" />

      {/* OVERLAYS & ADD-ONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Make It Yours</h2>
          <p className="mt-4 text-muted-foreground">
            Reskin the look. Bolt on extra Squares. Your workspace, your way.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="hover-tile p-8">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Overlays</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Change how your workspace looks. No effect on how it works.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Default", "Minimal", "Dark Academia", "Neon"].map((o) => (
                <span key={o} className="badge-soft">{o}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Add-on Squares</h3>
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
                        <span className="badge-violet">Add-on</span>
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
            Insights on productivity, systems, and building a better daily life.
          </p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {ARTICLES.map((a) => (
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
        <div className="mt-10 text-center">
          <Link to="/chronoblog" className="btn-outline-brand text-sm">View All Articles</Link>
        </div>
      </section>

      <div className="glow-divider" />

      {/* TEMPLATES + FLOWGRID — combined "while you wait" row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="badge-soft mb-4">In the meantime</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Start Today</h2>
          <p className="mt-4 text-muted-foreground">
            Templates and services from the ChronoSquares team — available now.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="hover-tile p-8 sm:p-10">
            <h3 className="text-2xl font-bold tracking-tight">Notion Templates</h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              High-performance Notion templates built on the same systems thinking as ChronoSquares.
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
            <span className="badge-violet mb-4">Coming Soon 2026</span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight">FlowGrid</h3>
            <p className="mt-1 text-sm text-muted-foreground">Automated Agency Onboarding</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              For service-based agencies drowning in manual onboarding. Intake, contracts, task
              setup, welcome flows — automated end to end.
            </p>
            <Link to="/flowgrid" className="mt-6 inline-flex btn-outline-brand text-sm">
              Learn More <ArrowRight size={14} />
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
          Add-on Squares can be purchased à la carte. Community-built Squares & Overlays via the Marketplace.
        </p>
      </section>

      <div className="glow-divider" />

      {/* WAITLIST */}
      <section id="waitlist" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Be First In</h2>
          <p className="mt-4 text-muted-foreground">
            ChronoSquares is in development. Join the waitlist for early access and updates.
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
    tagline: "The full 7 Squares — to taste the system.",
    features: [
      "All 7 core Squares",
      "Workflow Layer · 3 active rules",
      "AI Architect · 20 messages/day, no edit power",
      "Beta Add-on Squares · tasters",
    ],
  },
  {
    name: "Personal",
    price: "£TBD",
    cadence: "/month",
    tagline: "The full personal-OS, full depth, full architect.",
    highlight: true,
    features: [
      "Full feature depth on all 7 Squares",
      "Overlays included (skin your workspace)",
      "Unlimited Workflow rules",
      "AI Architect · unlimited chat + 5 builds/mo",
      "3 paid Personal Squares included",
      "Marketplace access — purchase more",
    ],
  },
  {
    name: "Business",
    price: "£TBD",
    cadence: "/month",
    tagline: "Everything Personal — across your team.",
    features: [
      "Everything in Personal · per seat",
      "Team workspace & collaboration",
      "Unlimited AI Architect · full build power",
      "All 7 Business Squares included",
      "Add extra Business Squares monthly",
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
