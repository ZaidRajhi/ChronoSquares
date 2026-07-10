export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  publishedAt: string; // ISO date
};

export const ARTICLES: Article[] = [
  {
    slug: "habit-tracking",
    title: "Habit Tracking That Actually Works",
    excerpt:
      "Discover the science behind effective habit tracking and how intelligent analytics can reveal patterns in your behaviour.",
    tags: ["Habits", "Analytics", "Behaviour"],
    readMinutes: 5,
    publishedAt: "2025-09-12",
    body: [
      "Most habit trackers fail for the same reason: they treat tracking as the goal. You log a check, you feel good, you move on. But a check on a calendar is just a record. It doesn't change anything by itself.",
      "Effective habit tracking does two things at once. First, it lowers the activation cost — making the act of starting frictionless. Second, it surfaces patterns you wouldn't otherwise see. Which days do you skip? Which habits cluster? When does a streak collapse?",
      "Habits compound silently. You don't notice the gap between the person who runs three times a week and the person who doesn't — until twelve months later, when the gap is enormous. The role of a tracker is to make the invisible visible, so you can adjust before the pattern hardens.",
      "Inside ChronoSquares, the Habits Square doesn't just record completions. It connects them to your goals, your time blocks, and your journal entries — building a richer picture of which behaviours actually move the needle.",
    ],
  },
  {
    slug: "time-management",
    title: "The Science of Time Management",
    excerpt: "Learn how to optimise your energy and attention instead of just managing hours.",
    tags: ["Time", "Focus", "Energy"],
    readMinutes: 6,
    publishedAt: "2025-10-03",
    body: [
      "Time management is a misnomer. You can't manage time — it elapses regardless. What you can manage is attention, energy, and intent. The hours show up either way. The question is what you put inside them.",
      "Most calendars are reactive. Meetings appear, deadlines stack, and your day fills with other people's priorities. By Friday you've worked 50 hours and built nothing of your own. The fix isn't more discipline — it's structural. Block your most valuable hours before anyone else can claim them.",
      "Energy management matters more than time management. A focused 90-minute block in the morning produces more than four scattered hours in the afternoon. Track when you do your best work, then defend that window like it's a meeting with the most important person in your life.",
      "The Time Square in ChronoSquares lets you log what you actually did, rate how productive each block felt, and see your week as it really happened — not as you remember it. Memory lies. Data doesn't.",
    ],
  },
  {
    slug: "productivity-logic",
    title: "Productivity Logic: Building Systems, Not Willpower",
    excerpt:
      "Explore how to replace willpower with intelligence. Better systems, not stronger determination.",
    tags: ["Systems", "Workflow", "Mindset"],
    readMinutes: 7,
    publishedAt: "2025-11-08",
    body: [
      "Willpower is a finite resource. By 6pm, after a day of meetings, decisions, and distractions, almost no one has any left. If your productivity depends on willpower, you'll succeed in the morning and fail by evening — every single day.",
      "Systems don't get tired. A rule that says 'every completed habit awards XP toward this goal' fires the same way at 6am and 6pm. A workflow that turns a finished task into the next one's due date doesn't need motivation. It just runs.",
      "The shift from willpower to systems is the most leveraged change you can make in how you work. It's not about working harder. It's about building scaffolding that makes the right action easier than the wrong one.",
      "ChronoSquares is built on this premise. The Workflow Layer connects your Squares so behaviour in one automatically updates state in another. You stop relying on remembering. You stop relying on motivation. You let the system do the carrying.",
    ],
  },
];

export const ARTICLES_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export const ALL_TAGS = Array.from(new Set(ARTICLES.flatMap((a) => a.tags))).sort();
