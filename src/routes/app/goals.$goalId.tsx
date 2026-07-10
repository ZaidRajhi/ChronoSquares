import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Module } from "@/components/app/Module";
import { ProgressRing } from "@/components/app/ProgressRing";
import { toast } from "sonner";
import { Trash2, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/app/goals/$goalId")({ component: GoalDetail });

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: "active" | "completed" | "paused";
}

interface Milestone {
  id: string;
  name: string;
  at_progress: number;
  reached: boolean;
}

function GoalDetail() {
  const { user } = useAuth();
  const { goalId } = Route.useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState({ name: "", at: 50 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: g }, { data: ms }] = await Promise.all([
        supabase.from("goals").select("*").eq("id", goalId).maybeSingle(),
        supabase.from("goal_milestones").select("*").eq("goal_id", goalId).order("at_progress"),
      ]);
      setGoal(g as Goal | null);
      setMilestones((ms as Milestone[]) ?? []);
    })();
  }, [user, goalId]);

  if (!goal) {
    return (
      <div>
        <Link to="/app/goals" className="mono text-[10px] text-muted-foreground hover:text-brand">← all goals</Link>
        <p className="text-muted-foreground mt-4">Loading goal…</p>
      </div>
    );
  }

  const setProgress = async (value: number) => {
    setGoal({ ...goal, progress: value });
    await supabase.from("goals").update({ progress: value }).eq("id", goal.id);
    // auto-mark milestones
    for (const m of milestones) {
      const shouldReach = value >= m.at_progress;
      if (shouldReach !== m.reached) {
        setMilestones((c) => c.map((x) => (x.id === m.id ? { ...x, reached: shouldReach } : x)));
        await supabase.from("goal_milestones").update({ reached: shouldReach }).eq("id", m.id);
      }
    }
    if (value >= 100 && goal.status !== "completed") {
      await supabase.from("goals").update({ status: "completed" }).eq("id", goal.id);
      setGoal((g) => g && ({ ...g, status: "completed" }));
      toast.success("Goal completed 🏁");
    }
  };

  const setStatus = async (status: Goal["status"]) => {
    setGoal({ ...goal, status });
    await supabase.from("goals").update({ status }).eq("id", goal.id);
  };

  const addMilestone = async () => {
    if (!user || !newMilestone.name.trim()) return;
    const { data, error } = await supabase.from("goal_milestones").insert({
      user_id: user.id,
      goal_id: goal.id,
      name: newMilestone.name.trim(),
      at_progress: newMilestone.at,
      reached: goal.progress >= newMilestone.at,
    }).select().single();
    if (error) return toast.error(error.message);
    setMilestones((c) => [...c, data as Milestone].sort((a, b) => a.at_progress - b.at_progress));
    setNewMilestone({ name: "", at: 50 });
  };

  const removeMilestone = async (id: string) => {
    setMilestones((c) => c.filter((m) => m.id !== id));
    await supabase.from("goal_milestones").delete().eq("id", id);
  };

  const deleteGoal = async () => {
    if (!confirm("Delete this goal? This is permanent.")) return;
    await supabase.from("goal_milestones").delete().eq("goal_id", goal.id);
    await supabase.from("goals").delete().eq("id", goal.id);
    navigate({ to: "/app/goals" });
  };

  return (
    <div>
      <Link to="/app/goals" className="mono text-[10px] text-muted-foreground hover:text-brand">← all goals</Link>
      <div className="flex items-start justify-between gap-4 mb-6 mt-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight"><span className="text-brand">◎</span> {goal.title}</h1>
          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
          {goal.target_date && <p className="mono text-[10px] text-muted-foreground mt-2">target · {goal.target_date}</p>}
        </div>
        <button onClick={deleteGoal} className="text-muted-foreground hover:text-destructive p-2" title="Delete goal"><Trash2 size={14} /></button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Module label="Progress" meta={goal.status}>
          <div className="flex flex-col items-center gap-4">
            <ProgressRing value={goal.progress} size={160} stroke={10} />
            <input type="range" min={0} max={100} value={goal.progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-brand" />
            <div className="flex gap-1.5 w-full">
              {(["active", "paused", "completed"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`flex-1 mono text-[10px] uppercase py-1.5 rounded border ${goal.status === s ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{s}</button>
              ))}
            </div>
          </div>
        </Module>

        <Module label="Milestones" meta={`${milestones.filter((m) => m.reached).length}/${milestones.length}`}>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet — add one below to break the goal into checkpoints.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {milestones.map((m) => (
                <li key={m.id} className={`flex items-center gap-3 p-2 rounded-md border ${m.reached ? "border-brand/40 bg-brand/5" : "border-border"}`}>
                  <div className={`size-5 rounded-full flex items-center justify-center ${m.reached ? "bg-brand text-brand-foreground" : "border border-border"}`}>
                    {m.reached && <Check size={12} />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${m.reached ? "line-through text-muted-foreground" : ""}`}>{m.name}</div>
                    <div className="mono text-[10px] text-muted-foreground">at {m.at_progress}%</div>
                  </div>
                  <button onClick={() => removeMilestone(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border pt-3">
            <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Add milestone</div>
            <div className="flex gap-2">
              <input value={newMilestone.name} onChange={(e) => setNewMilestone((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. First draft done" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <input type="number" min={1} max={100} value={newMilestone.at} onChange={(e) => setNewMilestone((s) => ({ ...s, at: Number(e.target.value) }))} className="w-20 bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <button onClick={addMilestone} className="btn-brand text-xs px-3"><Plus size={13} /></button>
            </div>
          </div>
        </Module>
      </div>
    </div>
  );
}
