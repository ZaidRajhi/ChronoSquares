import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useActiveSquares } from "@/lib/useActiveSquares";
import { SquareCube } from "@/components/app/SquareCube";
import { Module } from "@/components/app/Module";
import { WidgetShell } from "@/components/app/widgets/WidgetShell";
import { WidgetBody, getWidgetMeta } from "@/components/app/widgets/widgetRenderers";
import { WidgetCustomizer } from "@/components/app/widgets/WidgetCustomizer";
import { SortableWidget } from "@/components/app/widgets/SortableWidget";
import { WIDGET_REGISTRY, SIZE_CLASS, DEFAULT_LAYOUT, type WidgetType, type WidgetSize, type WidgetAppearance } from "@/lib/widgets";
import { Sparkles, Settings2, Plus, X, Pencil, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";

export const Route = createFileRoute("/app/dashboard")({ component: DashboardPage });

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
interface DbWidget {
  id: string;
  widget_type: WidgetType;
  size: WidgetSize;
  position: number;
  config: Record<string, unknown>;
  appearance: WidgetAppearance;
}

interface DashPrefs { showGreeting: boolean; showSquares: boolean; density: "comfortable" | "compact" | "cozy"; }

function DashboardPage() {
  const { user } = useAuth();
  const { activeSquares, loading: squaresLoading } = useActiveSquares();
  const [stats, setStats] = useState<Stats>({ streak: 0, taskPct: 0, focusHrs: 0 });
  const [widgets, setWidgets] = useState<DbWidget[]>([]);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [customizing, setCustomizing] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<DashPrefs>({ showGreeting: true, showSquares: true, density: "comfortable" });
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const name = (user?.user_metadata?.full_name as string)?.split(" ")[0] || "Operator";
  const greet = greetingFor(new Date().getHours());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: w }, { data: p }] = await Promise.all([
        supabase.from("dashboard_widgets").select("*").eq("user_id", user.id).order("position"),
        supabase.from("profiles").select("dash_show_greeting,dash_show_squares,dash_density").eq("id", user.id).maybeSingle(),
      ]);
      const list = ((w ?? []) as unknown as DbWidget[]).map((x) => ({ ...x, appearance: x.appearance ?? {} }));
      if (list.length === 0) {
        const seeded = await Promise.all(DEFAULT_LAYOUT.map((wd, i) =>
          supabase.from("dashboard_widgets").insert({ user_id: user.id, widget_type: wd.type, size: wd.size, position: i, config: {}, appearance: {} }).select().single()
        ));
        setWidgets(seeded.map((s) => ({ ...(s.data as unknown as DbWidget), appearance: {} })).filter(Boolean));
      } else {
        setWidgets(list);
      }
      if (p) {
        const pp = p as { dash_show_greeting?: boolean; dash_show_squares?: boolean; dash_density?: string };
        setPrefs({
          showGreeting: pp.dash_show_greeting ?? true,
          showSquares: pp.dash_show_squares ?? true,
          density: (pp.dash_density as DashPrefs["density"]) ?? "comfortable",
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  const updatePrefs = async (patch: Partial<DashPrefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    if (!user) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.showGreeting !== undefined) dbPatch.dash_show_greeting = patch.showGreeting;
    if (patch.showSquares !== undefined) dbPatch.dash_show_squares = patch.showSquares;
    if (patch.density !== undefined) dbPatch.dash_density = patch.density;
    await supabase.from("profiles").update(dbPatch as never).eq("id", user.id);
  };

  const addWidget = async (type: WidgetType) => {
    if (!user) return;
    const meta = WIDGET_REGISTRY.find((w) => w.type === type);
    const { data, error } = await supabase.from("dashboard_widgets").insert({
      user_id: user.id, widget_type: type, size: meta?.defaultSize ?? "md", position: widgets.length, config: {}, appearance: {},
    }).select().single();
    if (error) return toast.error(error.message);
    setWidgets((c) => [...c, { ...(data as unknown as DbWidget), appearance: {} }]);
    setPicking(false);
  };

  const removeWidget = async (id: string) => {
    setWidgets((c) => c.filter((w) => w.id !== id));
    await supabase.from("dashboard_widgets").delete().eq("id", id);
  };

  const cycleSize = async (w: DbWidget) => {
    const order: WidgetSize[] = ["sm", "md", "lg", "xl"];
    const next = order[(order.indexOf(w.size) + 1) % order.length];
    setWidgets((c) => c.map((x) => (x.id === w.id ? { ...x, size: next } : x)));
    await supabase.from("dashboard_widgets").update({ size: next }).eq("id", w.id);
  };

  const updateConfig = async (id: string, config: Record<string, unknown>) => {
    setWidgets((c) => c.map((x) => (x.id === id ? { ...x, config } : x)));
    await supabase.from("dashboard_widgets").update({ config: config as never }).eq("id", id);
  };

  const updateAppearance = async (id: string, appearance: WidgetAppearance) => {
    setWidgets((c) => c.map((x) => (x.id === id ? { ...x, appearance } : x)));
    await supabase.from("dashboard_widgets").update({ appearance: appearance as never }).eq("id", id);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = widgets.findIndex((w) => w.id === active.id);
    const newIdx = widgets.findIndex((w) => w.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(widgets, oldIdx, newIdx);
    setWidgets(reordered);
    await Promise.all(reordered.map((w, i) => supabase.from("dashboard_widgets").update({ position: i }).eq("id", w.id)));
  };

  const customizingWidget = useMemo(() => widgets.find((w) => w.id === customizing), [widgets, customizing]);
  const gap = prefs.density === "compact" ? "gap-2" : prefs.density === "cozy" ? "gap-6" : "gap-4";
  const sectionSpacing = prefs.density === "compact" ? "space-y-3" : prefs.density === "cozy" ? "space-y-8" : "space-y-6";

  return (
    <div className={sectionSpacing}>
      {prefs.showGreeting && (
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
      )}

      {prefs.showSquares && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles size={11} className="text-brand" /> Active squares · {activeSquares.length}
            </div>
            <Link to="/app/settings" className="mono text-[10px] uppercase text-muted-foreground hover:text-brand inline-flex items-center gap-1">
              <Settings2 size={11} /> Configure
            </Link>
          </div>
          {squaresLoading ? (
            <div className="text-muted-foreground text-sm">Booting squares…</div>
          ) : activeSquares.length === 0 ? (
            <Module label="Empty">
              <p className="text-sm text-muted-foreground">No squares enabled yet. Activate some from <Link to="/app/settings" className="text-brand hover:underline">Settings</Link>.</p>
            </Module>
          ) : (
            <div className="iso-floor-grid rounded-2xl p-6 sm:p-10 bg-card/20 border border-border/40">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {activeSquares.map((s) => (
                  <SquareCube key={s.slug} square={s} primaryStat="—" secondaryStat="LIVE" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
          <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">Mini-apps · {widgets.length}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {editing && (
              <>
                <button onClick={() => updatePrefs({ showGreeting: !prefs.showGreeting })} className="mono text-[10px] uppercase text-muted-foreground hover:text-brand inline-flex items-center gap-1">
                  {prefs.showGreeting ? <Eye size={11} /> : <EyeOff size={11} />} Greeting
                </button>
                <button onClick={() => updatePrefs({ showSquares: !prefs.showSquares })} className="mono text-[10px] uppercase text-muted-foreground hover:text-brand inline-flex items-center gap-1">
                  {prefs.showSquares ? <Eye size={11} /> : <EyeOff size={11} />} Squares
                </button>
                <select value={prefs.density} onChange={(e) => updatePrefs({ density: e.target.value as DashPrefs["density"] })} className="mono text-[10px] uppercase bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="cozy">Cozy</option>
                </select>
              </>
            )}
            <button onClick={() => setEditing((e) => !e)} className="mono text-[10px] uppercase text-muted-foreground hover:text-brand inline-flex items-center gap-1">
              {editing ? <><Check size={11} /> Done</> : <><Pencil size={11} /> Edit</>}
            </button>
            {editing && (
              <button onClick={() => setPicking(true)} className="btn-brand text-[10px] py-1 px-2 inline-flex items-center gap-1">
                <Plus size={11} /> Add
              </button>
            )}
          </div>
        </div>

        {widgets.length === 0 ? (
          <Module label="Empty">
            <p className="text-sm text-muted-foreground">No mini-apps pinned. Click <em>Edit</em> → <em>Add</em>.</p>
          </Module>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
              <div className={`grid grid-cols-12 ${gap}`}>
                {widgets.map((w) => {
                  const meta = getWidgetMeta(w.widget_type);
                  return (
                    <SortableWidget key={w.id} id={w.id} className={SIZE_CLASS[w.size]}>
                      {(dragProps) => (
                        <WidgetShell
                          title={meta.title}
                          icon={meta.icon}
                          appearance={w.appearance}
                          editing={editing}
                          onRemove={() => removeWidget(w.id)}
                          onResize={() => cycleSize(w)}
                          onCustomize={() => setCustomizing(w.id)}
                          dragHandleProps={dragProps}
                        >
                          <WidgetBody type={w.widget_type} config={w.config} onConfigChange={(next) => updateConfig(w.id, next)} />
                        </WidgetShell>
                      )}
                    </SortableWidget>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {picking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPicking(false)}>
          <div className="module max-w-3xl w-full p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Add a mini-app</h3>
              <button onClick={() => setPicking(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
            </div>
            {(["core", "productivity", "creative", "lifestyle"] as const).map((cat) => (
              <div key={cat} className="mb-4">
                <div className="mono text-[10px] uppercase text-muted-foreground mb-2">{cat}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {WIDGET_REGISTRY.filter((w) => w.category === cat).map((w) => {
                    const meta = getWidgetMeta(w.type);
                    return (
                      <button key={w.type} onClick={() => addWidget(w.type)} className="text-left p-3 rounded-xl border border-border/60 hover:border-brand/50 hover:bg-brand/5 transition-colors">
                        <div className="flex items-center gap-2 mono text-[10px] uppercase text-brand mb-1">{meta.icon}<span>{w.name}</span></div>
                        <p className="text-xs text-muted-foreground">{w.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {customizingWidget && (
        <WidgetCustomizer
          appearance={customizingWidget.appearance ?? {}}
          onChange={(next) => updateAppearance(customizingWidget.id, next)}
          onClose={() => setCustomizing(null)}
        />
      )}
    </div>
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
