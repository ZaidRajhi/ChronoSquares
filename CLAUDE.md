# ChronoSquares

> **Own your hours. Square them up.**

ChronoSquares is a shared client-delivery platform. It gives a service provider, their
client, and any other party involved (contractors, partners, stakeholders) **one
organised place** for every task, contract, cost, update, and person on an engagement —
from first enquiry through onboarding, delivery, payment, support, and renewal.

**Mission:** help agencies reclaim their time through a seamless client intake and
service-delivery system.

**Vision:** become the operating system for service delivery — one workspace where every
party collaborates from the first enquiry to renewal.

> This file is maintained by hand. Keep it accurate — correct it whenever the code or the
> product direction changes.

---

## The Seven Squares

The Squares are the service lifecycle. Each party sees only the Squares and detail
relevant to them.

| # | Square | Purpose |
|---|--------|---------|
| 1 | **Lead** | Enquiries, qualification, discovery, proposals, quotations. *(post-MVP)* |
| 2 | **Onboarding** | Intake forms, agreements, initial payment, document collection, kickoff. |
| 3 | **Project** | Milestones, tasks, responsibilities, dependencies, progress. |
| 4 | **Communication** | Updates, questions, decisions, approvals, meeting records. |
| 5 | **Finance** | Agreed costs, budgets, invoices, payment status. |
| 6 | **Files** | Contracts, assets, working documents, versions, deliverables. |
| 7 | **Care** | Support, feedback, issue resolution, renewals. *(post-MVP)* |

**MVP scope:** Onboarding → Project → Communication → Finance → Files, as one complete
delivery loop. Lead and Care are stubbed in the marketing site but not built in the app.

---

## Accounts, organisations, workspaces, roles

This is the model prior agents kept getting wrong. Read it carefully.

### One account, many memberships

A **person has one account** (one `auth.users` row, one `profiles` row). That account can
appear in many places with **different roles in each**. Someone can be the provider of
their own agency and, at the same time, a client inside another agency's workspace.

### Organisation

A **provider creates an organisation** (`delivery_organizations`) — their agency or
studio. The creator is its `owner_id` and gets a `provider` membership row
(`delivery_organization_members`). An organisation groups several client workspaces and
the provider's team.

### Workspace

A **workspace** (`delivery_workspaces`) is one client engagement inside an organisation.
Every workspace belongs to exactly one organisation, and that organisation's provider(s)
run it. A workspace **may** have a linked client (`delivery_clients`, optionally tied to a
real user account) — but it does **not have to**. A provider can stand a workspace up
first and invite the client later. `delivery_workspaces.client_id` is nullable.

- One organisation → many workspaces.
- One workspace → one organisation, one optional client, plus invited contractors/stakeholders.
- A provider is a provider for **every** workspace in their organisation.
- A client/contractor/stakeholder is scoped to the specific workspace(s) they were invited to.

### Roles (`delivery_organization_members.role`, `delivery_project_members.role`)

`provider` · `client` · `contractor` · `stakeholder`. Role is **derived from database
membership** — never from a client-side toggle. RLS in
`supabase/migrations/20260904090000_delivery_platform_mvp.sql` enforces what each role can
see (`delivery_is_provider`, `delivery_can_access_project`, shared vs. internal
visibility).

### Joining

People join through **email-bound, 7-day expiring invitations**
(`delivery_invitations`, `delivery_create_invitation` / `delivery_accept_invitation`).
The invite link only works for the invited email address. Accepting it writes a real
membership row with the assigned role.

### The workspace switcher

`src/lib/delivery.tsx` loads **every** space the signed-in person can act in (all provider
memberships × their workspaces, plus any workspace where they are the linked client) and
exposes them as `spaces`. `<SpaceSwitcher/>` (in `DeliveryShell.tsx`) lets them move
between organisations/workspaces and, if they are a provider somewhere, create another
workspace (`delivery_add_workspace`). The active choice is stored in `localStorage`
(`chronosquares-active-space`).

---

## The admin account

The platform admin account (a `user_roles` row with `role = 'admin'`;
`zaidrajhi@gmail.com` is the admin) is **not** a normal provider or client. It operates
the platform.

- **Admin panel** at `/app/admin` — overview stats, blog, store, waitlists, and **Plan
  Preview**.
- **View as** (`/app/admin/preview`): the admin picks a **plan**, a **role**
  (provider/client/contractor/stakeholder), and a **real organisation + workspace**, then
  the whole app re-renders as that person would see it — **read-only**, with a persistent
  banner across the top. Exiting returns the admin to their own view.
  - Implemented as a projection, **not impersonation**: `preview` state in
    `delivery.tsx` (persisted in `localStorage` as `chronosquares-admin-preview`), plus
    permissive admin-only `SELECT` RLS policies
    (`delivery_is_platform_admin`, migration `20260906120000_workspace_model_v2.sql`).
    Every mutation in `delivery.tsx` calls `assertWritable()` and throws while a preview
    is running.
  - The previewed plan overrides `profiles.testing_plan`; **real billing (`profiles.plan`)
    is never touched**.
- The admin still has a normal delivery side: they can create their own organisation and
  run real workspaces like any provider. The two do not mix.

---

## Colour scheme

Design tokens live in `src/styles.css` as CSS custom properties. `body` carries
`theme-dark` (default / public site) or `theme-light` (app light mode); custom palettes
are applied as inline `--*` overrides by `src/lib/userPrefs.tsx`.

### Default — "Obsidian Forest" (`:root` / `.theme-dark`)

The ChronoSquares signature look, used on the landing page and as the app's default.

| Token | Value (oklch) | Approx hex | Role |
|-------|---------------|------------|------|
| `--background` | `oklch(0.16 0.008 168)` | `#0D1312` | Deep obsidian-green canvas |
| `--foreground` | `oklch(0.98 0.002 160)` | `#F7FBF9` | Near-white text |
| `--card` | `oklch(0.22 0.008 168)` | `#1A2421` | Raised surface |
| `--border` | `oklch(0.30 0.012 168)` | `#26322E` | Hairline borders |
| `--muted` / `--secondary` | `oklch(0.26 0.010 168)` | `#212B28` | Muted fills |
| `--brand` (primary/accent) | `oklch(0.74 0.06 158)` | `#8AB79B` | Sage / mint — buttons, links, focus rings |
| `--brand-foreground` | `oklch(0.16 0.008 168)` | `#0D1312` | Text on brand fills |
| `--brand-violet` | `oklch(0.40 0.05 162)` | `#2D4A3E` | Emerald — secondary accent, "violet" badges |
| `--warning` | `oklch(0.78 0.16 75)` | amber | Overdue / needs attention |
| `--destructive` | `oklch(0.62 0.22 25)` | red | Destructive actions |

> Historical note: class names and some comments still say "violet" (`brand-violet`,
> `.badge-violet`) and old comments mention "electric cyan". The **actual** accents are
> sage green + emerald. Rename opportunistically; don't do a big-bang rename.

### App light — "Daylight" (`.theme-light`)

Sage on warm paper. `--background: oklch(0.99 0.004 160)`, `--card: #fff`,
`--brand: oklch(0.58 0.08 158)` (deeper sage for contrast on white),
`--brand-violet: oklch(0.42 0.05 162)`.

### Radius & signature

`--radius: 0.75rem`. Signature UI element: the **hover tile** (`.hover-tile`,
`.cs-mark` — a 2×2 square of brand/emerald) with a soft brand glow
(`--shadow-glow`). Buttons: `.btn-brand`, `.btn-outline-brand`. Badges: `.badge-soft`,
`.badge-violet`.

---

## Stack

- **Framework:** TanStack Start v1 (React 19), file-based routing (`src/routes`,
  `routeTree.gen.ts` is generated).
- **Build:** Vite 7. `tanstackStart()` plugin already embeds the router plugin — do **not**
  also add `TanStackRouterVite`.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) + shadcn/ui primitives in
  `src/components/ui`.
- **Backend:** Supabase — Postgres + Auth + RLS + Edge Functions + Storage + Realtime.
- **Data:** `@tanstack/react-query` is available; the delivery layer currently uses a
  hand-rolled context (`src/lib/delivery.tsx`) over the Supabase JS client.
- **Package manager:** npm (works) or Bun. `npm run dev` serves on **port 5000**.

### Key paths

```
src/
  routes/
    __root.tsx            app shell (Auth + UserPrefs providers, Toaster)
    index.tsx             landing page
    login.tsx  signup.tsx  reset-password.tsx
    join/$token.tsx       accept an invitation
    app.tsx              authed layout: auth gate + DeliveryProvider + admin preview banner
    app/
      dashboard onboarding project communication finance files   (delivery Squares)
      settings.tsx
      admin.tsx  admin.index.tsx  admin.blog.tsx  admin.store.tsx
      admin.waitlist.tsx  admin.preview.tsx   (admin only, gated by useUserRole)
  lib/
    auth.tsx            Supabase session context
    delivery.tsx        the delivery domain: spaces, roles, admin preview, mutations
    userPrefs.tsx       theme / nav / custom palette
    useUserRole.ts      is this account a platform admin?
  components/
    delivery/           DeliveryShell (SpaceSwitcher, primitives) + DeliveryPages (Squares)
    app/AppShell.tsx    authed chrome (nav variants, focus mode)
  integrations/supabase/ client.ts (browser), client.server.ts (service role), auth-middleware.ts
supabase/
  migrations/           full schema as SQL; newest = 20260906120000_workspace_model_v2.sql
  functions/ai-architect/  reserved for the AI Architect layer (OpenAI-backed)
```

---

## Environment / Supabase — important

`.env` holds the client vars. Both prefixes are needed (SSR reads `SUPABASE_*`, the
browser reads `VITE_SUPABASE_*`):

| Var | Notes |
|-----|-------|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | `https://uiontmbucqhyjsijsjhf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (safe for the client) |
| `VITE_SUPABASE_PROJECT_ID` / `SUPABASE_PROJECT_ID` | `uiontmbucqhyjsijsjhf` |
| `SUPABASE_SERVICE_ROLE_KEY` | server only — never expose. Needed for `client.server.ts` and the AI Architect function. |

**Gotchas learned the hard way:**

- **The live project is `uiontmbucqhyjsijsjhf`.** An earlier `.env` pointed at a *deleted*
  project (`jvbrddsasuozuvyzmjvd`) — DNS didn't even resolve — which is why sign-in failed
  locally. On Replit it worked only because Replit's `[userenv.shared]` vars overrode
  `.env`. Running locally, `.env` is the source of truth.
- If someone hands you a new Supabase key, **verify it against the URL** before trusting it
  (`POST {url}/auth/v1/token?grant_type=password` with a bogus login: `400
  invalid_credentials` = key matches the project; `401 Unregistered API key` = mismatch).
- The `supabase/migrations/` files are the schema of record, but the remote project's
  `schema_migrations` history is out of sync with them (the DB was built partly through
  Lovable tooling). Apply new migrations via the Supabase MCP / dashboard, not `supabase
  db push` against a clean history assumption.
- Auth: **email/password is enabled; Google OAuth is not** (the "Continue with Google"
  button will fail until the provider is configured in the Supabase dashboard).
- `.mcp.json` configures the Supabase MCP server and contains an access token — it is
  git-ignored.

---

## Running locally

```bash
npm install
npm run dev          # http://localhost:5000
npm run lint         # eslint (note: repo is not fully prettier-clean yet)
npx tsc --noEmit     # type check
```

---

## Conventions

- Keep the existing project structure; don't move files without a clear reason.
- Prefer Supabase native APIs over third-party wrappers.
- Delivery data is **real, fail-closed Supabase data**. No sample/fallback state, no
  client-side role switching. If a workspace can't load, show an error — don't invent data.
- Role and permissions come from the database (membership rows + RLS), never from UI state.
- Admin previews are **read-only projections**, never impersonation.
- Copy: plain, calm, specific. Avoid filler and "delightful"-style marketing voice inside
  the app.

---

## Adjacent products (marketing surface only for now)

- **FlowGrid** — done-for-you implementation, migration, and custom automation.
- **ChronoBlog** — the content/blog surface.
- **Store** — templates / courses / services.
- **AI Architect** — build workflows from a plain-language description of a service;
  summarise progress, risks, and decisions. Edge function scaffold in
  `supabase/functions/ai-architect`; needs `OPENAI_API_KEY` set as a Supabase secret.
