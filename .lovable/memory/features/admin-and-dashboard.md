---
name: Admin & Dashboard architecture
description: Admin role pattern, customisable widget dashboard, theme/nav personalisation, ChronoSquares 3D widget
type: feature
---

## Roles
- `user_roles` table + `has_role(uuid, app_role)` SECURITY DEFINER function (no recursive RLS).
- Admin = stored only in `user_roles`, NEVER on profiles. Check via `useUserRole()` hook in `src/lib/useUserRole.ts`.
- Admin email: zaidrajhi@gmail.com (seeded via insert).

## Dashboard
- Widget-based, drag-and-drop with `@dnd-kit/sortable`. Layout persisted in `dashboard_widgets` table per user.
- Widget types defined in `src/lib/widgets.ts`. Renderers in `src/components/app/widgets/widgetRenderers.tsx`.
- Sizes: sm/md/lg/xl mapped to 12-col grid. Cycle on resize button.
- First load seeds DEFAULT_LAYOUT.
- **ChronoSquares 3D widget**: react-three-fiber scene with glowing isometric cubes whose height encodes a normalised metric. Wrapped in `<ClientOnly>` because Canvas needs `window`. File: `src/components/app/widgets/ChronoSquares3D.tsx`. Sample data only for now — wire to habit/task/focus tables later.

## Admin panel (/app/admin)
- Tabs: Overview, Blog (CRUD), Store (CRUD), Waitlist, Plan Preview (toggles `profiles.testing_plan`).
- ChronoBlog/Store are DB-backed.

## Personalisation (`UserPrefsProvider` in `src/lib/userPrefs.tsx`)
Reads/writes the following columns on `profiles`:
- `theme_preference`: `dark` | `light` | `system` | `custom` (default `system`)
- `nav_position`: `sidebar` | `top` | `bottom` (default `top`)
- `focus_mode`: boolean — hides nav, shows floating exit chip
- `custom_palette`: jsonb `{brand, brandViolet, background, card}` applied as inline CSS vars on `:root`
- `theme_chosen`: drives the first-login `<ThemeChooser>` modal

`AppShell` (`src/components/app/AppShell.tsx`) renders sidebar/top/bottom variants based on `navPosition`. Settings page at `/app/settings`. Auth pages explicitly set `theme-dark`.
