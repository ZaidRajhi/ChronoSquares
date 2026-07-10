import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";
import { Trash2, X, Sparkles } from "lucide-react";
import { useSquareProperties } from "@/lib/useSquareProperties";
import { PropertyEditor } from "@/components/app/properties/PropertyEditor";
import { PropertyFields } from "@/components/app/properties/PropertyFields";

export const Route = createFileRoute("/app/tasks")({ component: TasksPage });

type Status = "todo" | "in_progress" | "done";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  is_routine_generated: boolean;
  routine_source: string | null;
}

const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-destructive",
  medium: "bg-amber-400",
  low: "bg-muted-foreground/40",
};

const GROUPS: { label: string; status: Status }[] = [
  { label: "To do", status: "todo" },
  { label: "In progress", status: "in_progress" },
  { label: "Done", status: "done" },
];

function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"list" | "board">("list");
  const [adding, setAdding] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  // Add form
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [pendingProps, setPendingProps] = useState<Record<string, string>>({});

  const props = useSquareProperties("tasks");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id,title,description,status,priority,due_date,is_routine_generated,routine_source")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) setTasks((data as Task[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const addTask = async () => {
    if (!user || !title.trim()) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: user.id, title: title.trim(), priority, status: "todo", due_date: dueDate || null })
      .select()
      .single();
    if (error) return toast.error(error.message);
    const t = data as Task;
    for (const [pid, val] of Object.entries(pendingProps)) if (val) await props.setValue(t.id, pid, val);
    setTasks((c) => [t, ...c]);
    setTitle(""); setDueDate(""); setPriority("medium"); setPendingProps({});
    setAdding(false);
  };

  const updateStatus = async (t: Task, status: Status) => {
    setTasks((c) => c.map((x) => (x.id === t.id ? { ...x, status } : x)));
    setOpenTask((cur) => (cur?.id === t.id ? { ...cur, status } : cur));
    await supabase.from("tasks").update({ status }).eq("id", t.id);
  };

  const updateField = async <K extends keyof Task>(t: Task, key: K, value: Task[K]) => {
    setTasks((c) => c.map((x) => (x.id === t.id ? { ...x, [key]: value } : x)));
    setOpenTask((cur) => (cur?.id === t.id ? { ...cur, [key]: value } : cur));
    const patch = { [key]: value } as Partial<Task>;
    await supabase.from("tasks").update(patch).eq("id", t.id);
  };

  const remove = async (id: string) => {
    setTasks((c) => c.filter((x) => x.id !== id));
    if (openTask?.id === id) setOpenTask(null);
    await supabase.from("tasks").delete().eq("id", id);
  };

  const grouped = useMemo(() => {
    const m: Record<Status, Task[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) m[t.status].push(t);
    return m;
  }, [tasks]);

  return (
    <SquarePageShell title="Tasks" icon="✓" blurb="Plan & ship the day." onAdd={() => setAdding(true)} addLabel="Add task" onProperties={() => setPropsOpen(true)}>
      <div className="flex gap-2 mb-5">
        {(["list", "board"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`mono text-[10px] uppercase px-3 py-1.5 rounded-md border transition-colors ${view === v ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {v}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <div className="space-y-4">
          {GROUPS.map((g) => {
            const items = grouped[g.status];
            return (
              <Module key={g.status} label={g.label} meta={`${items.length}`}>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing here.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {items.map((t) => (
                      <TaskRow key={t.id} t={t} props={props} onToggle={() => updateStatus(t, t.status === "done" ? "todo" : "done")} onOpen={() => setOpenTask(t)} onDelete={() => remove(t.id)} />
                    ))}
                  </ul>
                )}
              </Module>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {GROUPS.map((g) => (
            <Module key={g.status} label={g.label} meta={`${grouped[g.status].length}`}>
              <div className="space-y-2">
                {grouped[g.status].length === 0 && <p className="text-xs text-muted-foreground">Empty</p>}
                {grouped[g.status].map((t) => (
                  <button key={t.id} onClick={() => setOpenTask(t)} className="w-full text-left p-2.5 rounded-md border border-border bg-background/40 hover:border-brand/40 transition-colors">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`size-2 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                      <span className={`flex-1 ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                    </div>
                    {t.due_date && <div className="mono text-[10px] text-muted-foreground mt-1">{t.due_date}</div>}
                  </button>
                ))}
              </div>
            </Module>
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New task</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" autoFocus className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <label className="mono text-[10px] uppercase text-muted-foreground">Priority</label>
            <div className="flex gap-2 mb-3 mt-1">
              {(["low","medium","high"] as const).map((p) => (
                <button key={p} onClick={() => setPriority(p)} className={`mono text-[10px] uppercase px-2.5 py-1 rounded border ${priority === p ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{p}</button>
              ))}
            </div>
            <label className="mono text-[10px] uppercase text-muted-foreground">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full mb-3 mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            {props.properties.length > 0 && (
              <div className="mb-3"><PropertyFields properties={props.properties} values={pendingProps} onChange={(pid, v) => setPendingProps((cur) => ({ ...cur, [pid]: v }))} /></div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
              <button onClick={addTask} className="btn-brand text-xs py-1.5 px-3">Add task</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {openTask && (
        <TaskDrawer
          t={openTask}
          onClose={() => setOpenTask(null)}
          onChangeStatus={(s) => updateStatus(openTask, s)}
          onChangePriority={(p) => updateField(openTask, "priority", p)}
          onChangeDue={(d) => updateField(openTask, "due_date", d || null)}
          onChangeTitle={(t) => updateField(openTask, "title", t)}
          onChangeDescription={(d) => updateField(openTask, "description", d)}
          onDelete={() => remove(openTask.id)}
          props={props}
        />
      )}

      <PropertyEditor
        open={propsOpen}
        onClose={() => setPropsOpen(false)}
        squareLabel="Tasks"
        properties={props.properties}
        onAdd={props.addProperty}
        onUpdate={props.updateProperty}
        onDelete={props.deleteProperty}
      />
    </SquarePageShell>
  );
}

function TaskRow({ t, props, onToggle, onOpen, onDelete }: { t: Task; props: ReturnType<typeof useSquareProperties>; onToggle: () => void; onOpen: () => void; onDelete: () => void }) {
  const customs = props.properties;
  const vals = props.valuesFor(t.id);
  return (
    <li className="flex items-center gap-3 py-2">
      <input type="checkbox" checked={t.status === "done"} onChange={onToggle} onClick={(e) => e.stopPropagation()} className="accent-brand size-4" />
      <span className={`size-2 rounded-full ${PRIORITY_DOT[t.priority]}`} />
      <button onClick={onOpen} className={`flex-1 text-left text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
        {t.title}
        {t.is_routine_generated && <Sparkles size={10} className="inline ml-1.5 text-brand/70" />}
      </button>
      <div className="hidden sm:flex items-center gap-1.5 mono text-[10px] text-muted-foreground">
        {customs.slice(0, 2).map((p) => {
          const v = vals[p.id];
          if (!v) return null;
          return <span key={p.id} className="px-1.5 py-0.5 rounded bg-muted">{v}</span>;
        })}
      </div>
      {t.due_date && <span className="mono text-[10px] text-muted-foreground">{t.due_date}</span>}
      <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
    </li>
  );
}

function TaskDrawer({ t, onClose, onChangeStatus, onChangePriority, onChangeDue, onChangeTitle, onChangeDescription, onDelete, props }: {
  t: Task; onClose: () => void;
  onChangeStatus: (s: Status) => void; onChangePriority: (p: Priority) => void; onChangeDue: (d: string) => void;
  onChangeTitle: (v: string) => void; onChangeDescription: (v: string) => void; onDelete: () => void;
  props: ReturnType<typeof useSquareProperties>;
}) {
  const [title, setTitle] = useState(t.title);
  const [desc, setDesc] = useState(t.description ?? "");
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-card border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="mono text-[10px] uppercase text-muted-foreground">Task</div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== t.title && onChangeTitle(title)} className="w-full bg-transparent text-lg font-semibold focus:outline-none" />
          <div>
            <label className="mono text-[10px] uppercase text-muted-foreground">Status</label>
            <div className="flex gap-2 mt-1">
              {(["todo","in_progress","done"] as Status[]).map((s) => (
                <button key={s} onClick={() => onChangeStatus(s)} className={`mono text-[10px] uppercase px-2.5 py-1 rounded border ${t.status === s ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{s.replace("_"," ")}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mono text-[10px] uppercase text-muted-foreground">Priority</label>
            <div className="flex gap-2 mt-1">
              {(["low","medium","high"] as Priority[]).map((p) => (
                <button key={p} onClick={() => onChangePriority(p)} className={`mono text-[10px] uppercase px-2.5 py-1 rounded border ${t.priority === p ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mono text-[10px] uppercase text-muted-foreground">Due date</label>
            <input type="date" value={t.due_date ?? ""} onChange={(e) => onChangeDue(e.target.value)} className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mono text-[10px] uppercase text-muted-foreground">Notes</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} onBlur={() => desc !== (t.description ?? "") && onChangeDescription(desc)} rows={5} className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          {props.properties.length > 0 && (
            <div className="pt-3 border-t border-border">
              <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Custom fields</div>
              <PropertyFields properties={props.properties} values={props.valuesFor(t.id)} onChange={(pid, v) => props.setValue(t.id, pid, v)} />
            </div>
          )}
          <div className="pt-3 border-t border-border flex justify-end">
            <button onClick={onDelete} className="btn-outline-brand text-xs py-1.5 px-3 hover:!border-destructive hover:!text-destructive"><Trash2 size={13} /> Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}