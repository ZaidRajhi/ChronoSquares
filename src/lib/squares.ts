// Central definition of the 7 core Squares + add-ons.
// The internal Square pages live at /app/<slug>.

export type SquareSlug =
  | "habits"
  | "tasks"
  | "goals"
  | "journal"
  | "media"
  | "finance"
  | "time"
  | "gamification";

export interface SquareDef {
  slug: SquareSlug;
  name: string;
  icon: string;            // emoji shown on cube top face
  blurb: string;           // tagline
  isCore: boolean;         // 7 core Squares vs add-ons
  defaultEnabled: boolean;
  to: string;              // route
}

export const SQUARES: SquareDef[] = [
  { slug: "habits",   name: "Habits",   icon: "🌿", blurb: "Daily rituals & streaks",   isCore: true,  defaultEnabled: true,  to: "/app/habits" },
  { slug: "tasks",    name: "Tasks",    icon: "✓",  blurb: "Plan & ship the day",       isCore: true,  defaultEnabled: true,  to: "/app/tasks" },
  { slug: "goals",    name: "Goals",    icon: "◎",  blurb: "Long-arc objectives",       isCore: true,  defaultEnabled: true,  to: "/app/goals" },
  { slug: "journal",  name: "Journal",  icon: "✎",  blurb: "Reflect & remember",        isCore: true,  defaultEnabled: true,  to: "/app/journal" },
  { slug: "media",    name: "Media",    icon: "▶",  blurb: "Books, films, podcasts",    isCore: true,  defaultEnabled: true,  to: "/app/media" },
  { slug: "finance",  name: "Finance",  icon: "₵",  blurb: "Money in, money out",       isCore: true,  defaultEnabled: true,  to: "/app/finance" },
  { slug: "time",     name: "Time",     icon: "⏱",  blurb: "Block, log, rate",          isCore: true,  defaultEnabled: true,  to: "/app/time" },
  { slug: "gamification", name: "Dungeon", icon: "⚔", blurb: "Quests, XP & dungeons",   isCore: false, defaultEnabled: false, to: "/app/dungeon" },
];

export const CORE_SQUARES = SQUARES.filter((s) => s.isCore);
export const ADDON_SQUARES = SQUARES.filter((s) => !s.isCore);
export const SQUARE_BY_SLUG = Object.fromEntries(SQUARES.map((s) => [s.slug, s])) as Record<SquareSlug, SquareDef>;
