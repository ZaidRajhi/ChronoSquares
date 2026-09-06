---
name: ChronoSquares themes vs overlays split
description: How dashboard Theme (color) and Overlay (structural style) were separated to reuse one catalogue table for two independent concerns.
---

The `overlays` Supabase table + `user_overlays` join table originally powered a single conflated "apply" action that changed both the color palette AND the tile shape/widget mode at once. This was split into two independent concerns without any schema migration:

- **Theme** (Settings → Theme → Custom): applies only `overlay.palette` via `setCustomPalette`. "Active" is derived by comparing `profiles.custom_palette` to each catalogue palette — no new tracking column.
- **Overlay** (Settings → Overlays, standalone section between Theme and Navigation): applies only structural style. The picker now has three independent channels — Now Bar (`overlay-now-*`), Active Squares (`shape-*`), and Widgets (`overlay-widgets-*`) — so users can mix styles per dashboard area. The existing `user_overlays.is_applied` row remains the coordinated/default selection, while per-area choices persist in localStorage because the external schema has no area column.

**Why:** the DB is an external production Supabase project reachable only via service-role REST (DML), not the Postgres connection string — no ALTER TABLE/migrations possible without asking the user to run SQL. The `overlays.widget_mode`/`dimension` columns declared in the old TS interface never existed in the DB (dead code, always fell back to defaults).

**How to apply:** dashboard style profiles are derived via a hardcoded frontend slug→three-channel map in `src/lib/useOverlays.ts`, not new DB columns — extend that map when adding catalogue rows via REST INSERT. New free-tier overlay rows need a backfill INSERT into `user_overlays` for existing profiles, since the auto-grant trigger only fires on new profile creation. Custom themes must set the complete foreground/surface token family; incomplete palette JSON is normalized with contrast-aware light/dark defaults in `userPrefs.tsx`.
