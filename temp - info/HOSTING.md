# ChronoSquares — Self-Hosting & Portability Guide

ChronoSquares is built on **standard, portable tech**. No lock-in to Lovable. You can move the entire app — code, data, edge functions, auth — to any host that runs Node/Vite + Supabase (or Postgres + your own auth/edge layer).

## Stack at a glance
- **Frontend**: TanStack Start v1 (React 19) + Vite 7 + Tailwind v4
- **Backend**: Supabase (Postgres + Auth + Edge Functions + Storage)
- **AI**: Lovable AI Gateway today; swap to OpenAI / Anthropic / OpenRouter by changing the `fetch` URL + API key in `supabase/functions/ai-architect/index.ts`
- **Build target**: Cloudflare Worker (default) — also works on Node, Vercel, Netlify, Replit, Railway, Fly.io, your own VPS

## Files that matter
- `src/` — all UI + client logic
- `supabase/migrations/` — full database schema as plain SQL
- `supabase/functions/` — edge functions (Deno)
- `.env` — Supabase URL + publishable key (auto-generated; safe to recreate anywhere)
- `package.json`, `vite.config.ts`, `wrangler.jsonc` — standard build configs

## Move to your own infra (1 hour)

### 1. Export the database
```bash
# From Supabase dashboard → Project → Database → Backups → Download
# Or with the CLI:
supabase db dump --data-only > data.sql
supabase db dump --schema-only > schema.sql
```
The `supabase/migrations/` folder is the canonical schema — re-running every migration on a fresh Postgres instance recreates the entire app structure (tables, RLS, triggers, functions).

### 2. Spin up a new Supabase project (or any Postgres + GoTrue)
- Create a new project on supabase.com (or self-host with `supabase/supabase` Docker compose).
- Run the migrations: `supabase db push` (or `psql -f` each file in order).
- Restore data: `psql -f data.sql`.
- Deploy edge functions: `supabase functions deploy ai-architect` (and any others).
- Set secrets: `LOVABLE_API_KEY` (or replace it with `OPENAI_API_KEY` after editing the edge function).

### 3. Update `.env`
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 4. Deploy the frontend
- **Replit / Railway / Fly.io / VPS**: `bun install && bun run build && bun run start`
- **Cloudflare Workers**: `wrangler deploy` (config already in `wrangler.jsonc`)
- **Vercel / Netlify**: import the GitHub repo, set the env vars, deploy

## Swapping the AI provider
Open `supabase/functions/ai-architect/index.ts`. Replace:
```ts
fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { ... })
```
with the OpenAI / Anthropic / OpenRouter / local-Ollama equivalent. The request shape is OpenAI-compatible — no other code changes needed.

## What you keep
- 100% of user data (Postgres dump = complete)
- 100% of code (open source, in this repo)
- 100% of design system (Tailwind tokens in `src/styles.css`)
- All RLS policies, triggers, functions

## What you lose by leaving Lovable
- The visual editor
- Auto-deploy of edge functions on save
- The `LOVABLE_API_KEY` AI gateway (replace with your own provider key)

Nothing else. The app is yours.