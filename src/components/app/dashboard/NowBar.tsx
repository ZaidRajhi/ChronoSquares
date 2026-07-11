import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Module } from "@/components/app/Module";

const QUOTES = [
  "Discipline equals freedom.",
  "What gets measured gets managed.",
  "Slow is smooth, smooth is fast.",
  "You do not rise to the level of your goals — you fall to the level of your systems.",
  "The obstacle is the way.",
];

function greetingFor(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

interface Stats { streak: number; taskPct: number; focusHrs: number; }

/**
 * The "Now Bar" — top-of-dashboard status strip. Fully self-contained:
 * fetches its own stats and renders independently of Active Squares /
 * Widgets. Two content levels ("full" vs "minimal") plus a "hidden" state
 * are controlled by the parent via `show` / `minimal` props, so this
 * section can be set to nothing (minimal) or hidden entirely.
 */
export function NowBar({ show, minimal }: { show: boolean; minimal: boolean }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ streak: 0, taskPct: 0, focusHrs: 0 });
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const name = (user?.user_metadata?.full_name as string)?.split(" ")[0] || "Operator";
  const greet = greetingFor(new Date().getHours());

  useEffect(() => {
    if (!user || !show) return;
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: tasksToday }, { data: blocksToday }, { data: habitLogs }] = await Promise.all([
        supabase.from("tasks").select("status").eq("user_id", user.id),
        supabase.from("time_blocks").select("start_time, end_time").eq("user_id", user.id).gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`),
        supabase.from("habit_logs").select("completed_date").eq("user_id", user.id).order("completed_date", { ascending: false }).limit(60),
      ]);
      if (cancelled) return;
      const total = tasksToday?.length ?? 0;
      const done = tasksToday?.filter((t) => t.status === "done").length ?? 0;
      const taskPct = total === 0 ? 0 : Math.round((done / total) * 100);
      const focusHrs = (blocksToday ?? []).reduce((acc, b) => acc + Math.max(0, new Date(b.end_time).getTime() - new Date(b.start_time).getTime()), 0) / 3_600_000;
      const dates = new Set((habitLogs ?? []).map((l) => l.completed_date));
      let streak = 0; const cursor = new Date();
      while (dates.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setDate(cursor.getDate() - 1); }
      setStats({ streak, taskPct, focusHrs: Math.round(focusHrs * 10) / 10 });
    })();
    return () => { cancelled = true; };
  }, [user, show]);

  if (!show) return null;

  if (minimal) {
    return (
      <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-border/50 bg-card/20 text-sm">
        <span>Good {greet}, <span className="text-brand font-medium">{name}</span>.</span>
        <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {stats.streak}d streak · {stats.taskPct}% tasks · {stats.focusHrs}h focus
        </span>
      </div>
    );
  }

  return (
    <Module label="Today" meta={new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Good {greet}, <span className="text-gradient">{name}</span>.
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat value={`${stats.streak}d`} label="Streak" />
            <Stat value={`${stats.taskPct}%`} label="Tasks done" />
            <Stat value={`${stats.focusHrs}h`} label="Focused" />
          </div>
        </div>
        <div className="border-l border-border/60 lg:pl-6 hidden lg:block">
          <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Daily directive</div>
          <p className="text-base text-foreground/85 italic leading-relaxed">"{quote}"</p>
        </div>
      </div>
    </Module>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-brand">{value}</div>
      <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
