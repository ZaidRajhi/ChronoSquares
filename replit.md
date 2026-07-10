# ChronoSquares

A personal operating system built with TanStack Start (React 19), Supabase, and Tailwind CSS v4. Features a modular "Squares" workspace, AI Architect, drag-and-drop dashboards, 3D overlays, communities, and a marketplace.

## Stack

- **Frontend**: TanStack Start v1 + React 19 + TanStack Router (file-based)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage + Realtime)
- **AI**: AI Architect Edge Function → OpenAI GPT-4o (streaming, tool-calling)
- **3D**: Three.js + react-three-fiber
- **Package manager**: Bun (or npm — both work)

## Running locally (VS Code / Replit)

```bash
npm install        # or: bun install
npm run dev        # starts vite dev server on port 5000
```

Open `http://localhost:5000` (or the Replit preview URL).

## Environment variables

All required vars are in `.env`:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_URL` | Same URL, server-side |
| `SUPABASE_PUBLISHABLE_KEY` | Same key, server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only, never expose to client) |

For the AI Architect Edge Function, set `OPENAI_API_KEY` as a **Supabase secret**:
```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## Project structure

```
src/
  routes/          # TanStack file-based routes
    __root.tsx     # App shell (providers, layout)
    index.tsx      # Landing page
    login.tsx      # Sign in
    signup.tsx     # Sign up
    app/           # Authenticated app routes
      dashboard.tsx
      habits.tsx   tasks.tsx   goals.tsx
      finance.tsx  communities.tsx  marketplace.tsx
      settings.tsx
  components/      # Shared UI components
    ui/            # shadcn/ui primitives
  integrations/
    supabase/      # Supabase client, types, auth middleware
    oauth/         # OAuth helpers (Google, Apple, Microsoft via Supabase)
  lib/             # auth.tsx, userPrefs, architectTools, etc.
supabase/
  migrations/      # Full DB schema as SQL files
  functions/
    ai-architect/  # Edge Function: AI chat + tool execution
```

## Key features

- **Overlays** – visual themes applied via the AI Architect or settings
- **AI Architect** – streaming GPT-4o with 12 workspace tools (apply_overlay, create_habit, etc.)
- **Communities** – Supabase Realtime-powered group spaces
- **Marketplace** – overlay/widget store

## Google OAuth setup

Google sign-in uses native Supabase OAuth. Enable it in:
**Supabase Dashboard → Authentication → Providers → Google**

Add your Google OAuth client ID and secret there.

## Supabase Edge Functions

Deploy the AI Architect function:
```bash
supabase functions deploy ai-architect
supabase secrets set OPENAI_API_KEY=sk-...
```

## User preferences

- Keep the existing project structure — do not restructure or move files without a clear reason.
- Prefer Supabase native APIs over third-party wrappers.
- Use Bun for package management when possible; npm works as a fallback.
