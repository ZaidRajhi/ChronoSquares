import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";
import { Archive, Plus, Trash2, Power } from "lucide-react";
import { useSquareProperties } from "@/lib/useSquareProperties";
import { PropertyEditor } from "@/components/app/properties/PropertyEditor";
import { PropertyFields } from "@/components/app/properties/PropertyFields";

export const Route = createFileRoute("/app/habits")({ component: HabitsPage });

interface Habit {
  id: string;
  name: string;
  icon: string;
  colour: string;
  frequency: string;
  is_archived: boolean;
}
interface HabitLog { habit_id: string; completed_date: string }
interface Routine { id: string; name: string; is_enabled: boolean; tasks: string[] }

const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
};

function computeStreak(dates: Set<string>): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = daysAgoStr(i);
    if (dates.has(d)) streak++;
    else if (i === 0) {
      // allow yesterday-only streaks not to break today
      continue;
    } else break;
  }
  return streak;
}

function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tab, setTab] = useState<"today" | "all" | "routines">("today");
  const [adding, setAdding] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);

  // Add habit form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [pendingProps, setPendingProps] = useState<Record<string, string>>({});

  const props = useSquareProperties("habits");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const since = daysAgoStr(45);
      const [{ data: hs }, { data: ls }, { data: rs }] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", user.id).eq("is_archived", false).order("created_at"),
        supabase.from("habit_logs").select("habit_id, completed_date").eq("user_id", user.id).gte("completed_date", since),
        supabase.from("routines").select("id, name, is_enabled, tasks").eq("user_id", user.id).order("created_at"),
      ]);
      if (cancelled) return;
      setHabits((hs as Habit[]) ?? []);
      setLogs((ls as HabitLog[]) ?? []);
      setRoutines(((rs as { id: string; name: string; is_enabled: boolean; tasks: unknown }[]) ?? []).map((r) => ({
        id: r.id, name: r.name, is_enabled: r.is_enabled,
        tasks: Array.isArray(r.tasks) ? (r.tasks as string[]) : [],
      })));
      // Auto-generate today's routine tasks
      void generateRoutineTasksForToday(user.id, ((rs as { id: string; name: string; is_enabled: boolean; tasks: unknown }[]) ?? []).map((r) => ({
        id: r.id, name: r.name, is_enabled: r.is_enabled,
        tasks: Array.isArray(r.tasks) ? (r.tasks as string[]) : [],
      })));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const todaysCompletions = useMemo(() => {
    const t = todayStr();
    return new Set(logs.filter((l) => l.completed_date === t).map((l) => l.habit_id));
  }, [logs]);

  const datesByHabit = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const l of logs) (map[l.habit_id] ??= new Set()).add(l.completed_date);
    return map;
  }, [logs]);

  const toggleToday = async (h: Habit) => {
    if (!user) return;
    const today = todayStr();
    if (todaysCompletions.has(h.id)) {
      await supabase.from("habit_logs").delete().eq("user_id", user.id).eq("habit_id", h.id).eq("completed_date", today);
      setLogs((cur) => cur.filter((l) => !(l.habit_id === h.id && l.completed_date === today)));
    } else {
      await supabase.from("habit_logs").insert({ user_id: user.id, habit_id: h.id, completed_date: today });
      setLogs((cur) => [...cur, { habit_id: h.id, completed_date: today }]);
    }
  };

  const addHabit = async () => {
    if (!user || !name.trim()) return;
    const { data, error } = await supabase.from("habits").insert({
      user_id: user.id, name: name.trim(), icon, colour: "#34d399", frequency: "daily",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    const h = data as Habit;
    // Save custom property values
    for (const [pid, val] of Object.entries(pendingProps)) {
      if (val) await props.setValue(h.id, pid, val);
    }
    setHabits((cur) => [...cur, h]);
    setName(""); setIcon("✨"); setPendingProps({}); setAdding(false);
    toast.success("Habit added");
  };

  const archive = async (id: string) => {
    await supabase.from("habits").update({ is_archived: true }).eq("id", id);
    setHabits((cur) => cur.filter((h) => h.id !== id));
  };

  return (
    <SquarePageShell title="Habits" icon="🌿" blurb="Daily rituals & streaks." onAdd={() => setAdding(true)} addLabel="Add habit" onProperties={() => setPropsOpen(true)}>
      <div className="flex gap-2 mb-5">
        {(["today", "all", "routines"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`mono text-[10px] uppercase px-3 py-1.5 rounded-md border transition-colors ${tab === t ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {t === "today" ? "Today" : t === "all" ? "All habits" : "Routines"}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="space-y-5">
          <Module label="Check in" meta={new Date().toLocaleDateString()}>
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active habits. Add one to begin.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {habits.map((h) => {
                  const done = todaysCompletions.has(h.id);
                  return (
                    <button key={h.id} onClick={() => toggleToday(h)} className="flex flex-col items-center gap-2 group">
                      <div className={`size-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${done ? "bg-brand/20 border-brand shadow-[0_0_24px_oklch(0.74_0.06_158/0.5)]" : "border-border group-hover:border-brand/50"}`}>
                        {h.icon}
                      </div>
                      <div className="text-xs text-center">{h.name}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </Module>

          <Module label="Streak leaderboard">
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {[...habits]
                  .map((h) => ({ h, streak: computeStreak(datesByHabit[h.id] ?? new Set()) }))
                  .sort((a, b) => b.streak - a.streak)
                  .map(({ h, streak }) => (
                    <li key={h.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="text-base">{h.icon}</span>
                      <span className="flex-1">{h.name}</span>
                      <span className="mono text-brand">{streak}d</span>
                    </li>
                  ))}
              </ul>
            )}
          </Module>
        </div>
      )}

      {tab === "all" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {habits.map((h) => {
            const dates = datesByHabit[h.id] ?? new Set();
            const streak = computeStreak(dates);
            return (
              <Module key={h.id} label={h.frequency} meta={`${streak}d streak`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{h.icon}</span>
                    <div className="font-medium">{h.name}</div>
                  </div>
                  <button onClick={() => archive(h.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive" aria-label="Archive">
                    <Archive size={14} />
                  </button>
                </div>
                <Heatmap dates={dates} />
                {props.properties.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/60">
                    <PropertyFields
                      properties={props.properties}
                      values={props.valuesFor(h.id)}
                      onChange={(pid, v) => props.setValue(h.id, pid, v)}
                    />
                  </div>
                )}
              </Module>
            );
          })}
          {habits.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No habits yet.</p>}
        </div>
      )}

      {tab === "routines" && (
        <RoutinesPanel routines={routines} setRoutines={setRoutines} />
      )}

      {/* Add habit modal */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New habit</h3>
            <label className="mono text-[10px] uppercase text-muted-foreground">Icon</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} className="w-full mb-3 mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <label className="mono text-[10px] uppercase text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning pages" className="w-full mb-4 mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" autoFocus />
            {props.properties.length > 0 && (
              <div className="mb-4">
                <PropertyFields properties={props.properties} values={pendingProps} onChange={(pid, v) => setPendingProps((cur) => ({ ...cur, [pid]: v }))} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
              <button onClick={addHabit} className="btn-brand text-xs py-1.5 px-3">Add habit</button>
            </div>
          </div>
        </div>
      )}

      <PropertyEditor
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        squareLabel="Habits"
        properties={props.properties}
        onAdd={props.addProperty}
        onUpdate={props.updateProperty}
        onDelete={props.deleteProperty}
      />
    </SquarePageShell>
  );
}

function Heatmap({ dates }: { dates: Set<string> }) {
  const today = todayStr();
  const days = Array.from({ length: 30 }, (_, i) => daysAgoStr(29 - i));
  return (
    <div className="flex gap-[3px]">
      {days.map((d) => {
        const done = dates.has(d);
        const isToday = d === today;
        return (
          <div
            key={d}
            title={d}
            className={`size-3 rounded-[2px] ${done ? "bg-brand" : "bg-muted"} ${isToday ? "ring-1 ring-brand/60" : ""}`}
            style={done ? { boxShadow: "0 0 6px oklch(0.74 0.06 158 / 0.5)" } : undefined}
          />
        );
      })}
    </div>
  );
}

/* -------- Routines panel -------- */
function RoutinesPanel({ routines, setRoutines }: { routines: Routine[]; setRoutines: React.Dispatch<React.SetStateAction<Routine[]>> }) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [taskList, setTaskList] = useState<string[]>([]);

  const addRoutine = async () => {
    if (!user || !name.trim() || taskList.length === 0) return;
    const { data, error } = await supabase.from("routines").insert({
      user_id: user.id, name: name.trim(), is_enabled: true, tasks: taskList,
    }).select().single();
    if (error) return toast.error(error.message);
    const r = data as { id: string; name: string; is_enabled: boolean; tasks: unknown };
    setRoutines((cur) => [...cur, { id: r.id, name: r.name, is_enabled: r.is_enabled, tasks: taskList }]);
    setName(""); setTaskList([]); setTaskInput(""); setAdding(false);
    toast.success("Routine created — tasks will appear daily");
  };

  const toggle = async (r: Routine) => {
    const next = !r.is_enabled;
    setRoutines((cur) => cur.map((x) => (x.id === r.id ? { ...x, is_enabled: next } : x)));
    await supabase.from("routines").update({ is_enabled: next }).eq("id", r.id);
  };

  const remove = async (id: string) => {
    setRoutines((cur) => cur.filter((r) => r.id !== id));
    await supabase.from("routines").delete().eq("id", id);
  };

  return (
    <div className="space-y-4">
      <Module label="Routines" meta="auto-generate tasks daily">
        {routines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No routines. Create one to auto-spawn tasks each morning.</p>
        ) : (
          <ul className="space-y-2">
            {routines.map((r) => (
              <li key={r.id} className="flex items-start gap-3 p-3 border border-border rounded-md bg-background/40">
                <button onClick={() => toggle(r)} className={`mt-0.5 size-7 rounded-md flex items-center justify-center ${r.is_enabled ? "bg-brand/20 text-brand" : "bg-muted text-muted-foreground"}`}>
                  <Power size={13} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="mono text-[10px] text-muted-foreground mt-0.5">{r.tasks.length} task{r.tasks.length === 1 ? "" : "s"} · {r.is_enabled ? "active" : "paused"}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.tasks.map((t, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>)}
                  </div>
                </div>
                <button onClick={() => remove(r.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setAdding(true)} className="mt-3 btn-outline-brand text-xs py-1.5 px-3"><Plus size={13} /> New routine</button>
      </Module>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New routine</h3>
            <label className="mono text-[10px] uppercase text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning ritual" autoFocus className="w-full mb-3 mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <label className="mono text-[10px] uppercase text-muted-foreground">Tasks</label>
            <div className="flex gap-2 mt-1">
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && taskInput.trim()) { setTaskList((cur) => [...cur, taskInput.trim()]); setTaskInput(""); } }}
                placeholder="Type a task and press enter"
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>
            {taskList.length > 0 && (
              <ul className="mt-2 space-y-1">
                {taskList.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm bg-background/60 border border-border rounded px-2 py-1">
                    <span className="flex-1">{t}</span>
                    <button onClick={() => setTaskList((cur) => cur.filter((_, j) => j !== i))} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
              <button onClick={addRoutine} className="btn-brand text-xs py-1.5 px-3">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------- Daily routine task generation (client-side, idempotent) -------- */
async function generateRoutineTasksForToday(userId: string, routines: Routine[]) {
  const enabled = routines.filter((r) => r.is_enabled);
  if (enabled.length === 0) return;
  const today = todayStr();
  const { data: existing } = await supabase
    .from("tasks")
    .select("title, routine_source")
    .eq("user_id", userId)
    .eq("is_routine_generated", true)
    .eq("due_date", today);
  const existingKeys = new Set((existing ?? []).map((t) => `${t.routine_source}::${t.title}`));
  const toInsert: { user_id: string; title: string; status: string; priority: string; due_date: string; is_routine_generated: boolean; routine_source: string }[] = [];
  for (const r of enabled) {
    for (const title of r.tasks) {
      const key = `${r.id}::${title}`;
      if (!existingKeys.has(key)) {
        toInsert.push({ user_id: userId, title, status: "todo", priority: "medium", due_date: today, is_routine_generated: true, routine_source: r.id });
      }
    }
  }
  if (toInsert.length > 0) await supabase.from("tasks").insert(toInsert);
}