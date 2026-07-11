---
name: ChronoSquares themes vs overlays split
description: How dashboard Theme (color) and Overlay (structural style) were separated to reuse one catalogue table for two independent concerns.
---

The `overlays` Supabase table + `user_overlays` join table originally powered a single conflated "apply" action that changed both the color palette AND the tile shape/widget mode at once. This was split into two independent concerns without any schema migration:

- **Theme** (Settings → Theme → Custom): applies only `overlay.palette` via `setCustomPalette`. "Active" is derived by comparing `profiles.custom_palette` to each catalogue palette — no new tracking column.
- **Overlay** (Settings → Overlays, standalone section between Theme and Navigation): applies only structural style — Active Squares tile shape (body `shape-*` CSS class + localStorage) and Widgets visual mode (body `overlay-widgets-*` class). Uses the existing `user_overlays.is_applied` boolean, now scoped to style only.

**Why:** the DB is an external production Supabase project reachable only via service-role REST (DML), not the Postgres connection string — no ALTER TABLE/migrations possible without asking the user to run SQL. The `overlays.widget_mode`/`dimension` columns declared in the old TS interface never existed in the DB (dead code, always fell back to defaults).

**How to apply:** widget_mode is derived via a hardcoded frontend slug→mode map (`WIDGET_MODE_BY_SLUG` in `src/lib/useOverlays.ts`), not a DB column — extend that map when adding new overlay catalogue rows via REST INSERT. New free-tier overlay rows need a backfill INSERT into `user_overlays` for existing profiles, since the auto-grant trigger only fires on new profile creation.
