import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CORE_SQUARES, type SquareSlug } from "@/lib/squares";
import { Workflow, Zap, Play, Pause, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/workflows")({ component: WorkflowsPage });

type Rule = {
  id: string;
  name: string;
  is_enabled: boolean;
  source_square: string;
  trigger_event: string;
  target_square: string;
  action: string;
  run_count: number;
  last_run_at: string | null;
};

const TRIGGERS: Record<string, { value: string; label: string }[]> = {
  habits: [{ value: "completed", label: "Habit completed" }, { value: "streak_7", label: "7-day streak hit" }, { value: "streak_30", label: "30-day streak hit" }],
  tasks: [{ value: "created", label: "Task created" }, { value: "completed", label: "Task completed" }, { value: "overdue", label: "Task became overdue" }],
  goals: [{ value: "progress_25", label: "Goal hit 25%" }, { value: "progress_50", label: "Goal hit 50%" }, { value: "completed", label: "Goal completed" }],
  journal: [{ value: "entry_added", label: "Journal entry added" }],
  media: [{ value: "rated", label: "Media item rated" }, { value: "finished", label: "Media marked finished" }],
  finance: [{ value: "expense_added", label: "Expense added" }, { value: "budget_exceeded", label: "Budget exceeded" }],
  time: [{ value: "block_logged", label: "Time block logged" }, { value: "day_rated", label: "Day rated" }],
};

const ACTIONS: Record<string, { value: string; label: string }[]> = {
  tasks: [{ value: "create_task", label: "Create a task" }],
  goals: [{ value: "increment_progress", label: "Increment goal progress" }],
  journal: [{ value: "create_entry", label: "Add a journal entry" }],
  finance: [{ value: "log_transaction", label: "Log a transaction" }],
  habits: [{ value: "tick_habit", label: "Tick a habit" }],
  time: [{ value: "create_block", label: "Create a time block" }],
  media: [{ value: "add_item", label: "Add to media list" }],
};

function WorkflowsPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("workflow_rules").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setRules((data as Rule[]) ?? []);
    })();
  }, [user]);

  const toggleRule = async (id: string, value: boolean) => {
    setRules((r) => r.map((x) => x.id === id ? { ...x, is_enabled: value } : x));
    await supabase.from("workflow_rules").update({ is_enabled: value }).eq("id", id);
  };

  const removeRule = async (id: string) => {
    setRules((r) => r.filter((x) => x.id !== id));
    await supabase.from("workflow_rules").delete().eq("id", id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand uppercase tracking-wider mb-2">
            <Workflow size={12} /> Workflow Layer
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Connect your Squares</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Define if-this-then-that rules that flow data between your Squares. When a trigger fires in one Square, an action runs in another.
          </p>
        </div>
        <button onClick={() => setBuilding(true)} className="btn-brand text-sm px-4 py-2 inline-flex items-center gap-1.5">
          <Plus size={14} /> New rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="p-4 rounded-xl border border-border bg-card/40 flex items-center gap-4">
            <div className={`size-10 rounded-lg flex items-center justify-center ${r.is_enabled ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"}`}>
              <Zap size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                When <span className="text-foreground capitalize">{r.source_square}</span> · {r.trigger_event} → run <span className="text-foreground">{r.action}</span> in <span className="capitalize">{r.target_square}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Ran {r.run_count} times{r.last_run_at ? ` · last ${new Date(r.last_run_at).toLocaleDateString()}` : ""}</div>
            </div>
            <button onClick={() => toggleRule(r.id, !r.is_enabled)} className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-brand" aria-label={r.is_enabled ? "Pause" : "Enable"}>
              {r.is_enabled ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button onClick={() => removeRule(r.id)} className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive" aria-label="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <Workflow size={32} className="mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium">No rules yet</h3>
            <p className="text-xs text-muted-foreground mt-1">Build your first automation to connect your Squares.</p>
          </div>
        )}
      </div>

      {building && <RuleBuilder onClose={() => setBuilding(false)} onSaved={(r) => { setRules((cur) => [r, ...cur]); setBuilding(false); }} />}
    </div>
  );
}

function RuleBuilder({ onClose, onSaved }: { onClose: () => void; onSaved: (r: Rule) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [sourceSquare, setSourceSquare] = useState<SquareSlug>("habits");
  const [trigger, setTrigger] = useState(TRIGGERS.habits[0].value);
  const [targetSquare, setTargetSquare] = useState<SquareSlug>("tasks");
  const [action, setAction] = useState(ACTIONS.tasks[0].value);
  const [actionLabel, setActionLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const triggerOptions = TRIGGERS[sourceSquare] ?? [];
  const actionOptions = ACTIONS[targetSquare] ?? [];

  const save = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("workflow_rules").insert({
      user_id: user.id,
      name: name.trim(),
      source_square: sourceSquare,
      trigger_event: trigger,
      target_square: targetSquare,
      action,
      action_config: actionLabel ? { label: actionLabel } : {},
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Rule created");
    onSaved(data as Rule);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="module max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">New workflow rule</h3>
        <p className="text-xs text-muted-foreground mb-5">If-this-then-that across your Squares.</p>
        <div className="space-y-4">
          <div>
            <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 7-day meditation streak → log to journal" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">When (source)</label>
              <select value={sourceSquare} onChange={(e) => { const v = e.target.value as SquareSlug; setSourceSquare(v); setTrigger((TRIGGERS[v] ?? [])[0]?.value ?? ""); }} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {CORE_SQUARES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">Trigger</label>
              <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {triggerOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">Then (target)</label>
              <select value={targetSquare} onChange={(e) => { const v = e.target.value as SquareSlug; setTargetSquare(v); setAction((ACTIONS[v] ?? [])[0]?.value ?? ""); }} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {CORE_SQUARES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {actionOptions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mono text-[10px] uppercase text-muted-foreground mb-1 block">Item label / template (optional)</label>
            <input value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} placeholder="e.g. 'Reflect on streak'" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()} className="btn-brand text-xs py-1.5 px-3 disabled:opacity-50">Create rule</button>
        </div>
      </div>
    </div>
  );
}