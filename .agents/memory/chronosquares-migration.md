---
name: ChronoSquares Lovable migration
description: How Lovable-specific code was removed and replaced with standard TanStack Start + Supabase native code.
---

## Summary
Migrated ChronoSquares from Lovable platform to a standard TanStack Start v1 app.

## Key decisions

**Vite config**: TanStack Start v1.167+ uses `tanstackStart()` from `@tanstack/react-start/plugin/vite` as a Vite plugin (NOT vinxi). Dev command is `vite dev`. Router config options go inside a `router` sub-object; `routesDirectory` and `generatedRouteTree` are relative to `srcDirectory` (default `"src"`), so use `"routes"` not `"src/routes"`.

**Why**: Including `TanStackRouterVite` from `@tanstack/router-plugin/vite` alongside `tanstackStart()` causes `TSRSplitComponent is not defined` errors — `tanstackStart()` already embeds the router plugin internally.

**OAuth**: Replaced `@lovable.dev/cloud-auth-js` with native `supabase.auth.signInWithOAuth()`. Wrapper lives in `src/integrations/oauth/index.ts` (exported as `oauthClient`). Supabase provider type does not include `"microsoft"` — use `"azure"` instead.

**AI Architect edge function**: Replaced Lovable AI gateway (`https://ai.gateway.lovable.dev`) + `LOVABLE_API_KEY` with OpenAI API (`https://api.openai.com/v1/chat/completions`) + `OPENAI_API_KEY`. The key must be set as a Supabase secret: `supabase secrets set OPENAI_API_KEY=sk-...`.

**Deleted files**: `LEARNING-ROADMAP.md`, `temp - info/`, `wrangler.jsonc`, `bunfig.toml`, `src/integrations/lovable/` (replaced by `src/integrations/oauth/`).

**TypeScript**: `npx tsc --noEmit` passes clean. The tsconfig includes `vite.config.ts` so plugin types must be correct.

## What still needs user action
- Set `OPENAI_API_KEY` as a Supabase secret to enable AI Architect.
- Enable Google OAuth in Supabase Dashboard → Authentication → Providers → Google.

## Supabase project/key mismatches (recurring risk)
When a user pastes a new Supabase key mid-project, verify it against the actual project URL before trusting it — do not assume URL and key are a matched pair.

**Why:** The user supplied a new `sb_publishable_*` key that turned out to belong to a completely different Supabase project than the one already configured (`SUPABASE_URL` in `.env`/env vars). Using them together caused silent failures: DNS resolution errors when the URL was stale, then `"Unregistered API key"` from Supabase's auth endpoint when the key didn't match the URL actually in use.

**How to apply:** Before wiring in a user-supplied Supabase key, `curl` the auth token endpoint with a bogus login (`POST {url}/auth/v1/token?grant_type=password` with a fake email/password, `apikey: <key>` header) — a `401 Unregistered API key` means key/URL mismatch; a `400 invalid_credentials` means the key is valid for that project. Also `.env` is not the source of truth once Replit env vars are set for the same `VITE_*` keys — Vite's `loadEnv` gives priority to real process env vars over `.env` file values, so update Replit env vars, not `.env` (which is filesystem-protected anyway for secrets).
