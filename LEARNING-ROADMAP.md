# ChronoSquares — Solo Dev Learning Roadmap

You know no code today. To own this project end-to-end you do **not** need to learn everything at once. This roadmap is ordered: each tier unlocks the next. Skip ahead and you'll get stuck.

Estimated total to "comfortable solo dev on this codebase": **4–6 months of focused study (1–2 hrs/day)**. To "ship new features confidently": ~6 weeks.

---

## Tier 0 — Mental models (Week 1)
You can't read code without these. No syntax yet — just concepts.

- **What a web app actually is**: browser ↔ server ↔ database. Request/response. Why pages load.
- **Frontend vs backend vs database** — and which one each file in this project belongs to.
- **What an API is** (a function someone else's computer runs for you).
- **What a "framework" vs a "library" is.**
- **Git basics**: commit, branch, push, pull, merge, revert. Survival level only.

**Resources**: *How the Internet Works* (MDN), *The Missing Semester* (MIT, free), *Learn Git Branching* (interactive).

---

## Tier 1 — The language (Weeks 2–6)
Everything in this project is one language family: **TypeScript** (JavaScript + types).

1. **HTML** — 2 days. Tags, attributes, structure.
2. **CSS** — 1 week. Box model, flexbox, grid, selectors. Tailwind handles most of it.
3. **JavaScript** — 3 weeks. Variables, functions, arrays, objects, `if/else`, loops, `async/await`, `fetch`, ES modules.
4. **TypeScript** — 1 week. Types on top of JS: `string`, `number`, interfaces, generics (lightly).

**Resources**: freeCodeCamp's JS course, *JavaScript.info*, the official *TypeScript Handbook*.

**Checkpoint**: read `src/lib/widgets.ts` and understand every line.

---

## Tier 2 — The frontend stack (Weeks 7–12)
80% of your files live here.

- **React 19** — components, props, state, effects, context, custom hooks. Do the official react.dev tutorial.
- **TanStack Router** — file-based routing. `src/routes/` filenames map to URLs, `__root.tsx` is the shell, `_authenticated/` gates auth, `$param.tsx` is dynamic.
- **TanStack Query** — caching server data. `useQuery`, `useMutation`, `queryKey`, invalidation.
- **TanStack Start** — the full-stack glue. The one concept that matters: **`createServerFn`** lets you write backend code that the frontend calls like a normal function.
- **Tailwind CSS v4** — utility classes. Learn by reading existing components.
- **shadcn/ui** — `src/components/ui/`. These are *your* components. Edit them.
- **Radix UI** — what shadcn is built on (Dialog, Popover, etc.). Read on demand.

**Bonus for your vision**: **dnd-kit** (drag-and-drop), **Three.js + react-three-fiber** (3D squares), **Recharts** (charts).

**Checkpoint**: add a new page, wire it into nav, render data from the database.

---

## Tier 3 — The backend stack (Weeks 13–16)

- **Supabase fundamentals** — Postgres + Auth + Storage + Realtime + Edge Functions.
- **SQL** — `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN`, `WHERE`, indexes. Intermediate is enough.
- **Row-Level Security (RLS)** — rules that say "user A can read row X but not row Y". **Critical.** Read every policy in `supabase/migrations/`.
- **Migrations** — every DB change is a `.sql` file. Never edit the DB directly.
- **Auth flows** — sign up, sign in, OAuth, password reset, sessions. Read `src/routes/login.tsx`, `signup.tsx`, `reset-password.tsx`.
- **Edge Functions (Deno)** — `supabase/functions/ai-architect/`. Like Node.js, stricter.
- **`createServerFn` vs Edge Functions** — when to use which (see `temp - info/AGENTS.md`).

**Checkpoint**: add a new table with RLS, write a server function to read from it, call it from React.

---

## Tier 4 — AI integration (Weeks 17–18)
The AI Architect is the soul of your app.

- **LLM basics** — tokens, context windows, temperature, system prompts.
- **Tool calling** — how the model decides to call `apply_overlay` vs chat. Read `supabase/functions/ai-architect/index.ts` + `src/lib/architectTools.ts` side-by-side.
- **Streaming responses** — server-sent events, why the AI types word-by-word.
- **Prompt engineering** — system prompts, few-shot, structured output.
- **Embeddings + pgvector** (later) — for persistent AI memory.
- **OpenAI / Anthropic API shapes** — nearly identical. Lovable AI Gateway is OpenAI-compatible.

**Resources**: OpenAI cookbook, Anthropic's *Prompt Engineering* guide, Simon Willison's blog.

---

## Tier 5 — Production craft (ongoing)

- **Browser DevTools** — Network, Console, React DevTools. Non-negotiable.
- **Debugging discipline** — read errors top-to-bottom; find the *first* line that's yours.
- **Performance** — Lighthouse, lazy loading, code splitting, image optimization.
- **Accessibility** — semantic HTML, ARIA, keyboard nav.
- **SEO** — meta tags, OG images, sitemaps, structured data.
- **Security** — never trust client input, validate with Zod on the server, never put secrets in frontend code, understand CSRF/XSS basics.
- **Testing** — Playwright (e2e), Vitest (unit). Start light.
- **Observability** — Sentry, PostHog, logs. You have none today — add Sentry early.

---

## Tier 6 — Vision-specific gaps in this project
Each weak area maps to a learnable skill.

| Vision area | What to learn |
|---|---|
| **Billing (Free/Personal/Business)** | Stripe Checkout + Webhooks. ~1 week. |
| **Branded emails (logo, motto)** | React Email + verified sender domain. ~3 days. |
| **Marketplace at scale (search, filters)** | Postgres full-text search (`tsvector`) or Meilisearch. ~1 week. |
| **Communities (chat, DMs, channels)** | Supabase Realtime + presence. ~1 week. Partly built. |
| **AI Architect builds mini-apps** | JSON schema as a mini-app language + safe renderer. ~2 weeks. |
| **Overlays beyond color (shape, 3D)** | CSS custom properties + Three.js + manifest format. ~2 weeks. |
| **Mobile app** | Expo (React Native) reuses ~60% of code. ~3 weeks v1. |
| **Background jobs / scheduled automations** | Inngest or Trigger.dev. ~3 days. |
| **Rate limiting (AI abuse)** | Upstash Redis + middleware. ~2 days. |
| **Self-hosting / leaving Lovable** | Docker, Cloudflare Workers, Supabase CLI. See `temp - info/HOSTING.md`. ~1 week. |

---

## Tier 7 — Soft skills (the multiplier)

- **Reading code you didn't write** — #1 solo-dev skill. Practice daily on this repo.
- **Writing good prompts to your AI assistant** — specific > vague. Show examples.
- **Decomposition** — turn "build communities" into 20 tasks of 30 min each.
- **Saying no** — every feature is a maintenance bill forever. Ship in tight slices.
- **Reading docs before asking** — Supabase, TanStack, React, Tailwind are all top-tier docs.

---

## Suggested 6-month plan

- **Month 1**: Tier 0 + Tier 1. Build 3 tiny vanilla JS pages, no frameworks.
- **Month 2**: React basics. Rebuild one ChronoSquares page from scratch in a throwaway project.
- **Month 3**: TanStack + Supabase. Add one new small feature to ChronoSquares end-to-end.
- **Month 4**: AI. Extend the Architect with one new tool you designed.
- **Month 5**: Ship 2 vision gaps from Tier 6.
- **Month 6**: Polish. Add Sentry, Stripe, Playwright. Public launch.

---

## Daily habit

- 30 min reading code in this repo (start with `src/routes/app/dashboard.tsx`).
- 60 min building / following a tutorial.
- 15 min reading one doc page.
- Keep a `learnings.md` file. Future you will thank you.

## One rule

**Never paste code into your project you can't explain line by line.** AI will write it for you forever — but you must be the architect who knows *why*.
