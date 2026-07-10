import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Target, Activity, CheckSquare, BarChart3, Zap, Inbox, Quote, Image as ImageIcon, StickyNote, Calendar as CalendarIcon, Flag, Timer, Link2, BookOpen, Globe, Play, Pause, RotateCcw, Swords, MessageCircle, Boxes } from "lucide-react";
import type { WidgetType } from "@/lib/widgets";
import { toast } from "sonner";

export function getWidgetMeta(type: WidgetType) {
  switch (type) {
    case "today_focus":   return { icon: <Target size={11} />,      title: "Today's focus" };
    case "habits_today":  return { icon: <Activity size={11} />,    title: "Habits today" };
    case "tasks_today":   return { icon: <CheckSquare size={11} />, title: "Tasks today" };
    case "stats":         return { icon: <BarChart3 size={11} />,   title: "Stats" };
    case "ai_prompt":     return { icon: <Zap size={11} />,         title: "AI Architect" };
    case "square_launcher": return { icon: <Boxes size={11} />,     title: "Mini-app" };
    case "dungeon_quests": return { icon: <Swords size={11} />,     title: "Dungeon quests" };
    case "community_feed": return { icon: <MessageCircle size={11} />, title: "Community feed" };
    case "quick_capture": return { icon: <Inbox size={11} />,       title: "Quick capture" };
    case "quote":         return { icon: <Quote size={11} />,       title: "Daily quote" };
    case "image":         return { icon: <ImageIcon size={11} />,   title: "Pinned image" };
    case "note":          return { icon: <StickyNote size={11} />,  title: "Note" };
    case "calendar_mini": return { icon: <CalendarIcon size={11} />,title: "Calendar" };
    case "goal_progress": return { icon: <Flag size={11} />,        title: "Goal" };
    case "pomodoro":      return { icon: <Timer size={11} />,       title: "Pomodoro" };
    case "shortcut":      return { icon: <Link2 size={11} />,       title: "Shortcut" };
    case "journal_prompt":return { icon: <BookOpen size={11} />,    title: "Journal prompt" };
    case "iframe":        return { icon: <Globe size={11} />,       title: "Embed" };
    case "custom_app":    return { icon: <Sparkles size={11} />,    title: "Mini-App" };
    default:              return { icon: <Sparkles size={11} />,    title: "Widget" };
  }
}

interface WidgetProps {
  type: WidgetType;
  config: Record<string, unknown>;
  onConfigChange?: (next: Record<string, unknown>) => void;
}

const QUOTES = [
  { q: "We suffer more often in imagination than in reality.", a: "Seneca" },
  { q: "Discipline equals freedom.", a: "Jocko Willink" },
  { q: "What gets measured gets managed.", a: "Drucker" },
  { q: "The obstacle is the way.", a: "Marcus Aurelius" },
  { q: "Slow is smooth, smooth is fast.", a: "—" },
];

const PROMPTS = [
  "What's one thing you'd do differently if you could replay yesterday?",
  "What's draining your energy right now?",
  "What deserves your attention this week — and what doesn't?",
  "Where did you grow today, even slightly?",
  "What did you avoid? Why?",
];

export function WidgetBody({ type, config, onConfigChange }: WidgetProps) {
  switch (type) {
    case "today_focus":   return <TodayFocusWidget config={config} onConfigChange={onConfigChange} />;
    case "habits_today":  return <HabitsTodayWidget />;
    case "tasks_today":   return <TasksTodayWidget />;
    case "stats":         return <StatsWidget />;
    case "ai_prompt":     return <AiPromptWidget />;
    case "square_launcher": return <SquareLauncherWidget config={config} onConfigChange={onConfigChange} />;
    case "dungeon_quests": return <DungeonQuestsWidget />;
    case "community_feed": return <CommunityFeedWidget />;
    case "quick_capture": return <QuickCaptureWidget />;
    case "quote":         return <QuoteWidget />;
    case "image":         return <ImageWidget config={config} onConfigChange={onConfigChange} />;
    case "note":          return <NoteWidget config={config} onConfigChange={onConfigChange} />;
    case "calendar_mini": return <CalendarMiniWidget />;
    case "goal_progress": return <GoalProgressWidget config={config} onConfigChange={onConfigChange} />;
    case "pomodoro":      return <PomodoroWidget />;
    case "shortcut":      return <ShortcutWidget config={config} onConfigChange={onConfigChange} />;
    case "journal_prompt":return <JournalPromptWidget />;
    case "iframe":        return <IframeWidget config={config} onConfigChange={onConfigChange} />;
    case "custom_app":    return <CustomAppWidget config={config} onConfigChange={onConfigChange} />;
    default:              return null;
  }
}

function TodayFocusWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const focus = (config.focus as string) ?? "";
  const [val, setVal] = useState(focus);
  useEffect(() => setVal(focus), [focus]);
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onConfigChange?.({ ...config, focus: val })}
      placeholder="What's the one thing today?"
      className="w-full rounded-md bg-background/50 border border-border/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
    />
  );
}

interface Habit { id: string; name: string; icon: string; }
function HabitsTodayWidget() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: h }, { data: l }] = await Promise.all([
        supabase.from("habits").select("id,name,icon").eq("user_id", user.id).eq("is_archived", false),
        supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("completed_date", today),
      ]);
      setHabits((h as Habit[]) ?? []);
      setDone(new Set((l ?? []).map((x) => x.habit_id)));
    })();
  }, [user, today]);

  const toggle = async (h: Habit) => {
    if (!user) return;
    if (done.has(h.id)) {
      setDone((s) => { const n = new Set(s); n.delete(h.id); return n; });
      await supabase.from("habit_logs").delete().eq("user_id", user.id).eq("habit_id", h.id).eq("completed_date", today);
    } else {
      setDone((s) => new Set(s).add(h.id));
      await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: h.id, completed_date: today });
    }
  };

  if (habits.length === 0) {
    return <p className="text-xs text-muted-foreground">No habits yet. <Link to="/app/habits" className="text-brand hover:underline">Create one →</Link></p>;
  }
  return (
    <div className="space-y-1.5">
      {habits.slice(0, 6).map((h) => (
        <button key={h.id} onClick={() => toggle(h)} className="w-full flex items-center gap-2 text-sm text-left">
          <span className={`size-4 rounded border flex items-center justify-center ${done.has(h.id) ? "bg-brand border-brand" : "border-border"}`}>
            {done.has(h.id) && <span className="text-brand-foreground text-[10px]">✓</span>}
          </span>
          <span className="text-base">{h.icon}</span>
          <span className={done.has(h.id) ? "line-through text-muted-foreground" : ""}>{h.name}</span>
        </button>
      ))}
    </div>
  );
}

interface Task { id: string; title: string; status: string; priority: string; }
function TasksTodayWidget() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("tasks").select("id,title,status,priority").eq("user_id", user.id).neq("status", "done").order("priority").limit(6);
      setTasks((data as Task[]) ?? []);
    })();
  }, [user]);

  const complete = async (t: Task) => {
    setTasks((c) => c.filter((x) => x.id !== t.id));
    await supabase.from("tasks").update({ status: "done" }).eq("id", t.id);
  };

  if (tasks.length === 0) {
    return <p className="text-xs text-muted-foreground">All clear. <Link to="/app/tasks" className="text-brand hover:underline">Plan tomorrow →</Link></p>;
  }
  return (
    <div className="space-y-1.5">
      {tasks.map((t) => (
        <button key={t.id} onClick={() => complete(t)} className="w-full flex items-center gap-2 text-sm text-left hover:text-brand">
          <span className={`size-1.5 rounded-full shrink-0 ${t.priority === "high" ? "bg-destructive" : t.priority === "medium" ? "bg-amber-400" : "bg-brand"}`} />
          <span className="truncate">{t.title}</span>
        </button>
      ))}
    </div>
  );
}

function StatsWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ streak: 0, taskPct: 0, focusHrs: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ data: tasks }, { data: blocks }, { data: logs }] = await Promise.all([
        supabase.from("tasks").select("status").eq("user_id", user.id),
        supabase.from("time_blocks").select("start_time,end_time").eq("user_id", user.id).gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`),
        supabase.from("habit_logs").select("completed_date").eq("user_id", user.id).order("completed_date", { ascending: false }).limit(60),
      ]);
      const total = tasks?.length ?? 0;
      const done = tasks?.filter((t) => t.status === "done").length ?? 0;
      const taskPct = total === 0 ? 0 : Math.round((done / total) * 100);
      const focusHrs = (blocks ?? []).reduce((a, b) => a + Math.max(0, new Date(b.end_time).getTime() - new Date(b.start_time).getTime()), 0) / 3_600_000;
      const dates = new Set((logs ?? []).map((l) => l.completed_date));
      let streak = 0; const cursor = new Date();
      while (dates.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setDate(cursor.getDate() - 1); }
      setStats({ streak, taskPct, focusHrs: Math.round(focusHrs * 10) / 10 });
    })();
  }, [user]);
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat v={`${stats.streak}d`} l="Streak" />
      <Stat v={`${stats.taskPct}%`} l="Tasks" />
      <Stat v={`${stats.focusHrs}h`} l="Focus" />
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return <div><div className="text-xl font-semibold text-brand">{v}</div><div className="mono text-[10px] uppercase text-muted-foreground">{l}</div></div>;
}

function AiPromptWidget() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gradient-to-br from-brand/10 to-brand/0 border border-brand/20 p-3">
        <p className="text-xs">Open the Architect (⌘K) to plan, build, automate, or research.</p>
      </div>
      <Link to="/app/dashboard" className="btn-brand text-xs px-3 py-2 inline-block">Open Architect</Link>
    </div>
  );
}

function SquareLauncherWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const label = (config.label as string) ?? "Custom Square";
  const route = (config.route as string) ?? "/app/workflows";
  const glyph = (config.glyph as string) ?? "✦";
  const purpose = (config.purpose as string) ?? "A mini-app shell the Architect can reshape into a workflow, tracker, vault, studio, or operating surface.";
  const [editing, setEditing] = useState(!config.label);
  const [draft, setDraft] = useState({ label, route, glyph, purpose });
  if (editing) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-[3rem_1fr] gap-2">
          <input value={draft.glyph} onChange={(e) => setDraft((d) => ({ ...d, glyph: e.target.value }))} className="rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm text-center" />
          <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Mini-app name" className="rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm" />
        </div>
        <input value={draft.route} onChange={(e) => setDraft((d) => ({ ...d, route: e.target.value }))} placeholder="/app/tasks or https://…" className="w-full rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm" />
        <textarea value={draft.purpose} onChange={(e) => setDraft((d) => ({ ...d, purpose: e.target.value }))} rows={3} className="w-full rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm resize-none" />
        <button onClick={() => { onConfigChange?.({ ...config, ...draft }); setEditing(false); }} className="btn-brand text-xs py-1 px-2 w-full">Install shell</button>
      </div>
    );
  }
  return (
    <a href={route.startsWith("/") ? route : "/app/workflows"} className="block group">
      <div className="flex items-center gap-3">
        <div className="size-14 rounded-[1.1rem] bg-brand/10 border border-brand/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">{glyph}</div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{label}</div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{purpose}</p>
        </div>
      </div>
      <button onClick={(e) => { e.preventDefault(); setEditing(true); }} className="mt-3 mono text-[10px] uppercase text-muted-foreground hover:text-brand">edit shell</button>
    </a>
  );
}

function DungeonQuestsWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, habits: 0, goals: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: tasks }, { count: habits }, { count: goals }] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "done"),
        supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_archived", false),
        supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
      ]);
      setStats({ tasks: tasks ?? 0, habits: habits ?? 0, goals: goals ?? 0 });
    })();
  }, [user]);
  const xp = stats.tasks * 15 + stats.habits * 25 + stats.goals * 80;
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div><div className="text-3xl font-semibold text-brand">Lv {Math.max(1, Math.floor(xp / 120) + 1)}</div><div className="mono text-[10px] uppercase text-muted-foreground">{xp} open XP</div></div>
        <Link to="/app/dungeon" className="btn-outline-brand text-xs px-2 py-1">Enter</Link>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <QuestCount label="Tasks" value={stats.tasks} />
        <QuestCount label="Habits" value={stats.habits} />
        <QuestCount label="Goals" value={stats.goals} />
      </div>
    </div>
  );
}

function QuestCount({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-background/40 border border-border/40 p-2"><div className="text-lg font-semibold">{value}</div><div className="mono text-[9px] uppercase text-muted-foreground">{label}</div></div>;
}

function CommunityFeedWidget() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ id: string; body: string; created_at: string; community_id: string }[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const db = supabase as unknown as { from: (table: string) => { select: (columns: string) => any } };
      const { data: memberships } = await db.from("community_members").select("community_id").eq("user_id", user.id) as { data: { community_id: string }[] | null };
      const ids = (memberships ?? []).map((m) => m.community_id);
      if (ids.length === 0) return setMessages([]);
      const { data } = await db.from("community_messages").select("id,body,created_at,community_id").in("community_id", ids).order("created_at", { ascending: false }).limit(4) as { data: { id: string; body: string; created_at: string; community_id: string }[] | null };
      setMessages(data ?? []);
    })();
  }, [user]);
  if (messages.length === 0) return <p className="text-xs text-muted-foreground">Join a community and channel messages will surface here. <Link to="/app/communities" className="text-brand hover:underline">Browse →</Link></p>;
  return <div className="space-y-2">{messages.map((m) => <div key={m.id} className="text-xs border-l border-brand/40 pl-2"><p className="line-clamp-2">{m.body}</p><div className="mono text-[9px] uppercase text-muted-foreground mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div></div>)}</div>;
}

function QuickCaptureWidget() {
  const { user } = useAuth();
  const [val, setVal] = useState("");
  const send = async () => {
    if (!user || !val.trim()) return;
    const { error } = await supabase.from("tasks").insert({ user_id: user.id, title: val.trim() });
    if (error) return toast.error(error.message);
    toast.success("Captured to Tasks");
    setVal("");
  };
  return (
    <div className="space-y-2">
      <textarea value={val} onChange={(e) => setVal(e.target.value)} placeholder="Drop a thought…" className="w-full h-20 resize-none rounded-md bg-background/50 border border-border/60 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
      <button onClick={send} className="btn-brand text-xs py-1 px-3 w-full">File to Tasks</button>
    </div>
  );
}

function QuoteWidget() {
  const q = QUOTES[new Date().getDate() % QUOTES.length];
  return (
    <blockquote className="text-sm italic text-foreground/80">
      "{q.q}"
      <footer className="mt-2 mono text-[10px] not-italic text-muted-foreground">— {q.a}</footer>
    </blockquote>
  );
}

function ImageWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const url = (config.url as string) ?? "";
  const caption = (config.caption as string) ?? "";
  const [editing, setEditing] = useState(!url);
  const [draftUrl, setDraftUrl] = useState(url);
  const [draftCaption, setDraftCaption] = useState(caption);

  if (editing) {
    return (
      <div className="space-y-2">
        <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="Image URL (https://…)" className="w-full rounded-md bg-background/50 border border-border/60 px-3 py-2 text-sm" />
        <input value={draftCaption} onChange={(e) => setDraftCaption(e.target.value)} placeholder="Caption (optional)" className="w-full rounded-md bg-background/50 border border-border/60 px-3 py-2 text-sm" />
        <div className="flex justify-end gap-2">
          {url && <button onClick={() => setEditing(false)} className="btn-outline-brand text-xs py-1 px-2">Cancel</button>}
          <button onClick={() => { onConfigChange?.({ ...config, url: draftUrl, caption: draftCaption }); setEditing(false); }} className="btn-brand text-xs py-1 px-2">Save</button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <img src={url} alt={caption || "Pinned"} className="w-full rounded-md border border-border object-cover max-h-48" onError={() => toast.error("Image failed to load")} />
      {caption && <p className="text-xs text-muted-foreground italic">{caption}</p>}
      <button onClick={() => setEditing(true)} className="mono text-[10px] uppercase text-muted-foreground hover:text-brand">edit</button>
    </div>
  );
}

function NoteWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const text = (config.text as string) ?? "";
  const [val, setVal] = useState(text);
  useEffect(() => setVal(text), [text]);
  return (
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onConfigChange?.({ ...config, text: val })}
      placeholder="Free-form note. Markdown OK."
      className="w-full min-h-[120px] resize-y rounded-md bg-background/40 border border-border/40 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
    />
  );
}

function CalendarMiniWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const today = now.getDate();
  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <div>
      <div className="mono text-[10px] uppercase text-muted-foreground mb-1.5">{monthName}</div>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-muted-foreground py-0.5">{d}</div>)}
        {cells.map((c, i) => (
          <div key={i} className={`aspect-square flex items-center justify-center rounded ${c === today ? "bg-brand text-brand-foreground font-semibold" : c ? "text-foreground/80 hover:bg-muted/40" : ""}`}>
            {c ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Goal { id: string; title: string; progress: number; }
function GoalProgressWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const { user } = useAuth();
  const goalId = (config.goal_id as string) ?? "";
  const [goals, setGoals] = useState<Goal[]>([]);
  const [picking, setPicking] = useState(!goalId);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("goals").select("id,title,progress").eq("user_id", user.id).eq("status", "active");
      setGoals((data as Goal[]) ?? []);
    })();
  }, [user]);

  const goal = goals.find((g) => g.id === goalId);

  if (picking || !goal) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Pick a goal to track:</p>
        {goals.length === 0 && <p className="text-xs"><Link to="/app/goals" className="text-brand">Create one →</Link></p>}
        {goals.map((g) => (
          <button key={g.id} onClick={() => { onConfigChange?.({ ...config, goal_id: g.id }); setPicking(false); }} className="block w-full text-left text-sm hover:text-brand">
            {g.title}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium truncate">{goal.title}</div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand to-brand-violet transition-all" style={{ width: `${goal.progress}%` }} />
      </div>
      <div className="flex justify-between mono text-[10px] uppercase text-muted-foreground">
        <span>{goal.progress}%</span>
        <button onClick={() => setPicking(true)} className="hover:text-brand">change</button>
      </div>
    </div>
  );
}

function PomodoroWidget() {
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => {
      if (s <= 1) { setRunning(false); toast.success("Pomodoro complete"); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [running]);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return (
    <div className="text-center space-y-2">
      <div className="text-3xl font-semibold tabular-nums text-brand">{m}:{s}</div>
      <div className="flex justify-center gap-1">
        <button onClick={() => setRunning((r) => !r)} className="p-1.5 rounded-md bg-brand/10 hover:bg-brand/20 text-brand">
          {running ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => { setRunning(false); setSecs(25 * 60); }} className="p-1.5 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

function ShortcutWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const url = (config.url as string) ?? "";
  const label = (config.label as string) ?? "";
  const [editing, setEditing] = useState(!url);
  const [draftUrl, setDraftUrl] = useState(url);
  const [draftLabel, setDraftLabel] = useState(label);
  if (editing) {
    return (
      <div className="space-y-2">
        <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} placeholder="Label" className="w-full rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm" />
        <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="URL or /app/..." className="w-full rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm" />
        <button onClick={() => { onConfigChange?.({ ...config, url: draftUrl, label: draftLabel }); setEditing(false); }} className="btn-brand text-xs py-1 px-2 w-full">Save</button>
      </div>
    );
  }
  return (
    <a href={url} target={url.startsWith("http") ? "_blank" : "_self"} rel="noreferrer" className="block py-3 text-center">
      <div className="text-base font-medium text-brand hover:underline">{label || url}</div>
      <button onClick={(e) => { e.preventDefault(); setEditing(true); }} className="mt-1 mono text-[10px] uppercase text-muted-foreground hover:text-brand">edit</button>
    </a>
  );
}

function JournalPromptWidget() {
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];
  return (
    <div className="space-y-2">
      <p className="text-sm italic text-foreground/85">"{prompt}"</p>
      <Link to="/app/journal" className="mono text-[10px] uppercase text-brand hover:underline">Write entry →</Link>
    </div>
  );
}

function IframeWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const url = (config.url as string) ?? "";
  const [editing, setEditing] = useState(!url);
  const [draft, setDraft] = useState(url);
  if (editing) {
    return (
      <div className="space-y-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://open.spotify.com/embed/…" className="w-full rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-sm" />
        <button onClick={() => { onConfigChange?.({ ...config, url: draft }); setEditing(false); }} className="btn-brand text-xs py-1 px-2">Embed</button>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <iframe src={url} className="w-full h-56 rounded-md border border-border/60" allow="autoplay; encrypted-media" />
      <button onClick={() => setEditing(true)} className="mono text-[10px] uppercase text-muted-foreground hover:text-brand">edit</button>
    </div>
  );
}

interface CustomAction { label: string; href?: string; emoji?: string; }
interface CustomStat { label: string; value: string; }
/**
 * Custom Mini-App widget — the AI Architect's canvas.
 * Renders a fully bespoke micro-app from a JSON config:
 *   { title, subtitle, emoji, accent, layout: "stats"|"actions"|"hero"|"split",
 *     stats: [{label,value}], actions: [{label,href,emoji}], body: string }
 * No code-gen, no eval — declarative, safe, portable.
 */
function CustomAppWidget({ config, onConfigChange }: { config: Record<string, unknown>; onConfigChange?: (n: Record<string, unknown>) => void }) {
  const title = (config.title as string) ?? "Custom Mini-App";
  const subtitle = (config.subtitle as string) ?? "";
  const emoji = (config.emoji as string) ?? "✦";
  const layout = (config.layout as string) ?? "hero";
  const accent = (config.accent as string) ?? "brand";
  const body = (config.body as string) ?? "";
  const stats = Array.isArray(config.stats) ? (config.stats as CustomStat[]) : [];
  const actions = Array.isArray(config.actions) ? (config.actions as CustomAction[]) : [];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(JSON.stringify(config, null, 2));

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} className="w-full rounded-md bg-background/50 border border-border/60 px-2 py-1.5 text-[11px] font-mono" />
        <div className="flex gap-2">
          <button onClick={() => { try { onConfigChange?.(JSON.parse(draft)); setEditing(false); } catch { toast.error("Invalid JSON"); } }} className="btn-brand text-xs py-1 px-2 flex-1">Save</button>
          <button onClick={() => setEditing(false)} className="btn-outline-brand text-xs py-1 px-2">Cancel</button>
        </div>
      </div>
    );
  }

  const accentClass = accent === "violet" ? "text-violet-400" : accent === "amber" ? "text-amber-400" : accent === "rose" ? "text-rose-400" : accent === "cyan" ? "text-cyan-400" : accent === "emerald" ? "text-emerald-400" : "text-brand";

  return (
    <div className="space-y-3 relative group">
      <button onClick={() => { setDraft(JSON.stringify(config, null, 2)); setEditing(true); }} className="absolute top-0 right-0 mono text-[9px] uppercase text-muted-foreground hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity">edit</button>
      {layout === "hero" && (
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-2xl bg-gradient-to-br from-brand/20 to-transparent border border-brand/30 flex items-center justify-center text-2xl ${accentClass}`}>{emoji}</div>
          <div className="flex-1 min-w-0"><div className="text-base font-semibold truncate">{title}</div>{subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}</div>
        </div>
      )}
      {layout === "split" && (
        <div className="grid grid-cols-2 gap-3 items-center">
          <div className={`aspect-square rounded-3xl bg-gradient-to-br from-brand/30 via-brand/10 to-transparent border border-brand/30 flex items-center justify-center text-5xl ${accentClass}`}>{emoji}</div>
          <div><div className="text-base font-semibold">{title}</div>{subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}</div>
        </div>
      )}
      {(layout === "stats" || layout === "actions") && (
        <div className="flex items-center gap-2"><span className={`text-xl ${accentClass}`}>{emoji}</span><span className="text-sm font-semibold">{title}</span></div>
      )}

      {body && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{body}</p>}

      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {stats.slice(0, 6).map((s, i) => (
            <div key={i} className="rounded-lg bg-background/40 border border-border/40 p-2 text-center">
              <div className={`text-lg font-semibold ${accentClass}`}>{s.value}</div>
              <div className="mono text-[9px] uppercase text-muted-foreground mt-0.5 truncate">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {actions.slice(0, 6).map((a, i) => (
            <a key={i} href={a.href ?? "#"} target={a.href?.startsWith("http") ? "_blank" : "_self"} rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 hover:bg-brand/20 border border-brand/30 text-[11px] text-brand transition-colors">
              {a.emoji && <span>{a.emoji}</span>}{a.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
