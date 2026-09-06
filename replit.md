# ChronoSquares

A shared client-delivery platform built with TanStack Start (React 19), Supabase, and Tailwind CSS v4. It gives providers, clients, contractors, and stakeholders role-based workspaces for onboarding, projects, communication, finance, and files.

## Stack

- **Frontend**: TanStack Start v1 + React 19 + TanStack Router (file-based)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage + Realtime)
- **Future platform direction**: Workflow Layer and AI Architect for provider configuration and operational assistance
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

## Project structure

```
src/
  routes/          # TanStack file-based routes
    __root.tsx     # App shell (providers, layout)
    index.tsx      # Landing page
    login.tsx      # Sign in
    signup.tsx     # Sign up
     app/             # Authenticated app routes
       dashboard.tsx onboarding.tsx project.tsx communication.tsx
       finance.tsx files.tsx settings.tsx
  components/      # Shared UI components
    ui/            # shadcn/ui primitives
  integrations/
    supabase/      # Supabase client, types, auth middleware
    oauth/         # OAuth helpers (Google, Apple, Microsoft via Supabase)
   lib/             # auth.tsx, userPrefs, delivery.tsx, themes
supabase/
  migrations/      # Full DB schema as SQL files
  functions/
    ai-architect/    # Reserved for the future AI Architect layer
```

## Key features

- **Delivery workspace** – provider dashboard and scoped client portal
- **MVP delivery loop** – onboarding → project → communication → finance → files
- **Role-based access** – database policies for provider, client, contractor, and stakeholder views
- **Themes** – existing visual theme catalogue remains available in settings

## Google OAuth setup

Google sign-in uses native Supabase OAuth. Enable it in:
**Supabase Dashboard → Authentication → Providers → Google**

Add your Google OAuth client ID and secret there.

## User preferences

- Keep the existing project structure — do not restructure or move files without a clear reason.
- Prefer Supabase native APIs over third-party wrappers.
- Use Bun for package management when possible; npm works as a fallback.
