# AGENTS.md — Onboarding for any AI working on ChronoSquares

If you are an AI agent (Cursor, Claude Code, Replit Ghostwriter, Aider, Codex, etc.) picking up this project for the first time, read this top-to-bottom before touching code.

## What this project is
**ChronoSquares** — a personal-OS "super app." The user (Zaid) is building one tool that replaces habits/tasks/goals/journal/media/finance/time apps, plus an AI Architect that customises the whole workspace, plus communities, plus a marketplace. Long horizon. Big vision. Treat every change as a step toward that, not a one-off feature.

## Core philosophy (do not violate)
1. **Anti-SaaS aesthetic** — obsidian, glass, sage/emerald, generous whitespace. No bordered "cards" inside `/app` — use `.glass-module` + `.void-bg`. The dashboard is "floating modules in a void."
2. **Customisable to the bone** — every layout, color, shape, widget, nav item should be user-controllable. The AI Architect is the primary customisation surface.
3. **Portable** — never add a hard dependency on a Lovable-specific API beyond what's already abstracted in `src/integrations/lovable/`. See `HOSTING.md`.
4. **Agent, not chatbot** — the AI Architect uses tool calls, web search, multi-step planning. Never weaken it back into a basic Q&A bot.
5. **One small correction beats many big rewrites** — when the user reports an issue, fix that issue surgically. Don't redesign half the app to address it.

## Tech stack
- TanStack Start v1 (React 19, file-based routing in `src/routes/`)
- Vite 7 + Tailwind v4 (tokens in `src/styles.css`)
- Supabase (Postgres + Auth + Edge Functions) — fully managed via `supabase/migrations/`
- AI via Lovable AI Gateway today (OpenAI-compatible, swappable — see `HOSTING.md`)
- Build target: Cloudflare Workers (`wrangler.jsonc`)

## Critical files
| File | Purpose |
|---|---|
| `src/routes/__root.tsx` | App shell (do not replace) |
| `src/routes/index.tsx` | Public landing page |
| `src/components/app/AppShell.tsx` | Authed app chrome — navigation, theme, etc. |
| `src/components/app/AIArchitect.tsx` | Architect chat UI |
| `src/lib/architectTools.ts` | Tool implementations the Architect calls |
| `supabase/functions/ai-architect/index.ts` | Architect backend (system prompt, tool defs, model) |
| `src/styles.css` | All design tokens. Never hardcode colors in components — use semantic tokens. |
| `src/integrations/supabase/types.ts` | Auto-generated; never edit manually |
| `src/integrations/supabase/client.ts` | Auto-generated; never edit manually |

## Database
- Schema lives in `supabase/migrations/` as plain SQL.
- Always use migrations for schema changes — never raw `ALTER TABLE` from edge functions.
- All user-data tables MUST have RLS policies. Roles live in `user_roles` (never on `profiles`). Check via `has_role(auth.uid(), 'admin')`.

## AI Architect — keep advancing
- Model: `openai/gpt-5` with `reasoning.effort: "medium"`.
- Tools: `apply_overlay`, `toggle_square`, `set_focus_mode`, `set_nav_position`, `hide_nav_items`, `add_dashboard_widget`, `create_workflow_rule`, `create_habit`, `create_goal`, `web_search`. Add more — never remove.
- Tool loop runs up to 6 turns. Multi-step chains are expected.
- Markdown rendering is on. Use it.
- Every tool action is logged in `architect_actions` for one-tap revert.

## Visual rules
- **Public site**: electric cyan + violet brand.
- **App** (`/app/*`): Obsidian Forest (sage + emerald on deep green), with light-mode opt-in.
- Overlays change BOTH palette AND structural shape (`rounded` / `sharp` / `cloud` / `minimal2d`) — see `body.shape-*` classes in `src/styles.css`.

## Common pitfalls
- Never edit `src/integrations/supabase/types.ts` or `src/routeTree.gen.ts` — both auto-generated.
- Never use `react-router-dom` — this is TanStack Router. Imports from `@tanstack/react-router`.
- Use `<Link>` not `<a>` for in-app nav.
- Routes are flat dot-separated: `app.dashboard.tsx`, not `app/dashboard.tsx` directories.
- Edge functions deploy automatically on save when running on Lovable.

## When in doubt
Ask the user before refactoring shared infra. Implement narrow features without asking.