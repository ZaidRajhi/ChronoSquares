export type WidgetType =
  | "today_focus"
  | "habits_today"
  | "tasks_today"
  | "stats"
  | "ai_prompt"
  | "square_launcher"
  | "dungeon_quests"
  | "community_feed"
  | "quick_capture"
  | "quote"
  | "image"
  | "note"
  | "calendar_mini"
  | "goal_progress"
  | "pomodoro"
  | "shortcut"
  | "journal_prompt"
  | "iframe"
  | "custom_app";

export type WidgetSize = "sm" | "md" | "lg" | "xl";

/** Per-widget appearance — stored as JSON in dashboard_widgets.appearance */
export interface WidgetAppearance {
  /** background style: glass (default), solid, ghost (no bg), gradient */
  surface?: "glass" | "solid" | "ghost" | "gradient";
  /** accent ring/bar color override */
  accent?: "brand" | "violet" | "amber" | "rose" | "cyan" | "emerald";
  /** corner shape: rounded, sharp, pill, organic */
  shape?: "rounded" | "sharp" | "pill" | "organic";
  /** show or hide header chrome */
  hideHeader?: boolean;
  /** subtle background tint hex */
  tintHex?: string;
  /** stronger widget visual language beyond the default shell */
  visualMode?: "calm" | "hud" | "terminal" | "poster" | "artifact";
}

export interface WidgetMeta {
  type: WidgetType;
  name: string;
  description: string;
  defaultSize: WidgetSize;
  category: "core" | "productivity" | "creative" | "lifestyle";
}

export const WIDGET_REGISTRY: WidgetMeta[] = [
  { type: "today_focus", name: "Today's Focus", description: "One thing that matters today.", defaultSize: "md", category: "core" },
  { type: "habits_today", name: "Habits Today", description: "Quick check-off of today's habits.", defaultSize: "md", category: "core" },
  { type: "tasks_today", name: "Today's Tasks", description: "Tasks due or in progress.", defaultSize: "md", category: "core" },
  { type: "stats", name: "Stats", description: "Streaks, completion %, week glance.", defaultSize: "md", category: "core" },
  { type: "ai_prompt", name: "AI Architect", description: "Ask. Build. Automate.", defaultSize: "lg", category: "core" },
  { type: "square_launcher", name: "Square Launcher", description: "A custom mini-app doorway built by the Architect.", defaultSize: "md", category: "core" },
  { type: "dungeon_quests", name: "Dungeon Quests", description: "Convert habits, tasks, and goals into XP quests.", defaultSize: "md", category: "core" },
  { type: "quick_capture", name: "Quick Capture", description: "Drop a thought. File it later.", defaultSize: "sm", category: "productivity" },
  { type: "note", name: "Note", description: "Free-form markdown note pinned to your dashboard.", defaultSize: "md", category: "productivity" },
  { type: "calendar_mini", name: "Calendar", description: "Mini month grid with today highlighted.", defaultSize: "md", category: "productivity" },
  { type: "goal_progress", name: "Goal Progress", description: "Track progress on a chosen goal.", defaultSize: "md", category: "productivity" },
  { type: "pomodoro", name: "Pomodoro", description: "25-minute focus timer.", defaultSize: "sm", category: "productivity" },
  { type: "shortcut", name: "Shortcut", description: "Pin any URL or app route.", defaultSize: "sm", category: "lifestyle" },
  { type: "journal_prompt", name: "Journal Prompt", description: "Daily reflection prompt.", defaultSize: "md", category: "lifestyle" },
  { type: "community_feed", name: "Community Feed", description: "Live channel messages from communities you join.", defaultSize: "lg", category: "lifestyle" },
  { type: "quote", name: "Daily Quote", description: "One line of stoicism.", defaultSize: "sm", category: "lifestyle" },
  { type: "image", name: "Image", description: "Pin an image — upload or URL.", defaultSize: "md", category: "creative" },
  { type: "iframe", name: "Embed", description: "Embed any URL via iframe (Spotify, YouTube, Figma…).", defaultSize: "lg", category: "creative" },
  { type: "custom_app", name: "Custom Mini-App", description: "AI-authored mini-app: arbitrary HTML, links, stats, and quick actions.", defaultSize: "lg", category: "creative" },
];

export const SIZE_CLASS: Record<WidgetSize, string> = {
  sm: "col-span-12 sm:col-span-6 md:col-span-3",
  md: "col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-4",
  lg: "col-span-12 md:col-span-8 lg:col-span-8",
  xl: "col-span-12",
};

export const DEFAULT_LAYOUT: { type: WidgetType; size: WidgetSize }[] = [
  { type: "today_focus", size: "lg" },
  { type: "tasks_today", size: "md" },
  { type: "habits_today", size: "md" },
  { type: "stats", size: "md" },
  { type: "calendar_mini", size: "md" },
  { type: "quick_capture", size: "sm" },
];
