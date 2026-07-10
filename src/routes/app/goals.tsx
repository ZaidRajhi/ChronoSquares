import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { ProgressRing } from "@/components/app/ProgressRing";
import { toast } from "sonner";

export const Route = createFileRoute("/app/goals")({ component: GoalsPage });

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: "active" | "completed" | "paused";
}

function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<"all" | Goal["status"]>("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_date: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setGoals((data as Goal[]) ?? []);
    })();
  }, [user]);

  const filtered = useMemo(() => filter === "all" ? goals : goals.filter((g) => g.status === filter), [goals, filter]);
  const counts = useMemo(() => ({
    active: goals.filter((g) => g.status === "active").length,
    completed: goals.filter((g) => g.status === "completed").length,
    paused: goals.filter((g) => g.status === "paused").length,
    avgProgress: goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0,
  }), [goals]);

  const add = async () => {
    if (!user || !form.title.trim()) return;
    const { data, error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      target_date: form.target_date || null,
    }).select().single();
    if (error) return toast.error(error.message);
    setGoals((c) => [data as Goal, ...c]);
    setForm({ title: "", description: "", target_date: "" });
    setAdding(false);
  };

  return (
    <SquarePageShell title="Goals" icon="◎" blurb="Long-arc objectives — what you're building toward." onAdd={() => setAdding(true)} addLabel="New goal">
      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Active" value={counts.active} />
        <Stat label="Completed" value={counts.completed} />
        <Stat label="Paused" value={counts.paused} />
        <Stat label="Avg progress" value={`${counts.avgProgress}%`} />
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "active", "completed", "paused"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`mono text-[10px] uppercase px-3 py-1.5 rounded-md border transition-colors ${filter === f ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((g) => (
          <Link key={g.id} to="/app/goals/$goalId" params={{ goalId: g.id }} className="block group">
            <Module label={g.status} meta={g.target_date ?? "no deadline"} className="group-hover:border-brand/40 transition-colors">
              <div className="flex items-start gap-4">
                <ProgressRing value={g.progress} size={64} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{g.title}</div>
                  {g.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>}
                  <div className="mono text-[10px] text-brand mt-2">tap to open →</div>
                </div>
              </div>
            </Module>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No goals here.</p>}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New goal</h3>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="What are you aiming for?" autoFocus className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Why does it matter? (optional)" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm min-h-[80px]" />
            <label className="block mono text-[10px] uppercase text-muted-foreground mb-1">Target date (optional)</label>
            <input type="date" value={form.target_date} onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))} className="w-full mb-4 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
              <button onClick={add} className="btn-brand text-xs py-1.5 px-3">Create</button>
            </div>
          </div>
        </div>
      )}
    </SquarePageShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Module label={label}>
      <div className="text-2xl font-semibold text-brand">{value}</div>
    </Module>
  );
}
