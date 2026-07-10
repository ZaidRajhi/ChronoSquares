import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { Swords, Trophy, Zap } from "lucide-react";

export const Route = createFileRoute("/app/dungeon")({ component: DungeonPage });

interface Quest { id: string; title: string; source: "tasks" | "habits" | "goals"; xp: number; href: string; }

function DungeonPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: tasks }, { data: habits }, { data: goals }] = await Promise.all([
        supabase.from("tasks").select("id,title,priority").eq("user_id", user.id).neq("status", "done").limit(8),
        supabase.from("habits").select("id,name").eq("user_id", user.id).eq("is_archived", false).limit(8),
        supabase.from("goals").select("id,title,progress").eq("user_id", user.id).eq("status", "active").limit(8),
      ]);
      setQuests([
        ...((tasks ?? []).map((t) => ({ id: t.id, title: t.title, source: "tasks" as const, xp: t.priority === "high" ? 80 : 45, href: "/app/tasks" }))),
        ...((habits ?? []).map((h) => ({ id: h.id, title: h.name, source: "habits" as const, xp: 35, href: "/app/habits" }))),
        ...((goals ?? []).map((g) => ({ id: g.id, title: g.title, source: "goals" as const, xp: 120 - Math.min(100, g.progress ?? 0), href: `/app/goals/${g.id}` }))),
      ]);
    })();
  }, [user]);

  const xp = useMemo(() => quests.reduce((sum, q) => sum + q.xp, 0), [quests]);
  const level = Math.max(1, Math.floor(xp / 250) + 1);

  return (
    <SquarePageShell title="Dungeon" icon="⚔" blurb="Gamify the work already living inside your Squares.">
      <div className="grid md:grid-cols-[1fr_1.4fr] gap-4 mb-6">
        <Module label="Adventurer" meta={`Level ${level}`} className="hud-corners">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full border border-brand/40 bg-brand/10 flex items-center justify-center"><Swords className="text-brand" size={28} /></div>
            <div><div className="text-3xl font-semibold text-brand">{xp} XP</div><div className="text-xs text-muted-foreground">Open quests across Tasks, Habits, and Goals.</div></div>
          </div>
        </Module>
        <Module label="Next unlock" meta="Prototype">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Reward icon={<Zap size={16} />} label="Streak spells" />
            <Reward icon={<Trophy size={16} />} label="Boss goals" />
            <Reward icon={<Swords size={16} />} label="Party raids" />
          </div>
        </Module>
      </div>
      <Module label="Quest board" meta={`${quests.length} active`}>
        <div className="space-y-2">
          {quests.map((q) => <a key={`${q.source}-${q.id}`} href={q.href} className="flex items-center gap-3 rounded-md bg-background/35 border border-border/40 px-3 py-2 hover:border-brand/50"><span className="mono text-[10px] uppercase text-brand w-14">{q.source}</span><span className="flex-1 text-sm truncate">{q.title}</span><span className="mono text-[10px] text-muted-foreground">+{q.xp} XP</span></a>)}
          {quests.length === 0 && <p className="text-sm text-muted-foreground">No quests yet. Add tasks, habits, or goals to populate the board.</p>}
        </div>
      </Module>
    </SquarePageShell>
  );
}

function Reward({ icon, label }: { icon: ReactNode; label: string }) {
  return <div className="rounded-lg bg-background/35 border border-border/40 p-3"><div className="mx-auto mb-2 size-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">{icon}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}