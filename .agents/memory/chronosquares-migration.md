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
- Optionally set `SUPABASE_SERVICE_ROLE_KEY` as a Replit secret for server-side admin ops.
