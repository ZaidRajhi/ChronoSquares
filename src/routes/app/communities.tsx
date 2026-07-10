import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Users, BadgeCheck, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/communities")({ component: CommunitiesPage });

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  topic: string;
  member_count: number;
  is_official: boolean;
}

const TOPIC_LABELS: Record<string, string> = {
  habits: "Habits",
  time: "Time",
  tasks: "Tasks",
  goals: "Goals",
  journal: "Journal",
  media: "Media",
  finance: "Finance",
  general: "General",
};

function CommunitiesPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Community[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cs }, mem] = await Promise.all([
        (supabase.from("communities" as never) as unknown as { select: (s: string) => { order: (c: string, o: object) => Promise<{ data: Community[] }> } })
          .select("*").order("member_count", { ascending: false }),
        user
          ? (supabase.from("community_members" as never) as unknown as { select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: { community_id: string }[] }> } })
              .select("community_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] as { community_id: string }[] }),
      ]);
      if (cancelled) return;
      setList(cs ?? []);
      setMemberships(new Set((mem.data ?? []).map((r) => r.community_id)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const join = async (c: Community) => {
    if (!user) { toast.error("Sign in to join"); return; }
    const { error } = await (supabase.from("community_members" as never) as unknown as { insert: (r: object) => Promise<{ error: { message: string } | null }> })
      .insert({ community_id: c.id, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    setMemberships((s) => new Set([...s, c.id]));
    setList((prev) => prev.map((x) => (x.id === c.id ? { ...x, member_count: x.member_count + 1 } : x)));
    toast.success(`Joined ${c.name}`);
  };

  const leave = async (c: Community) => {
    if (!user) return;
    await (supabase.from("community_members" as never) as unknown as { delete: () => { eq: (a: string, b: string) => { eq: (a: string, b: string) => Promise<unknown> } } })
      .delete().eq("community_id", c.id).eq("user_id", user.id);
    setMemberships((s) => { const n = new Set(s); n.delete(c.id); return n; });
    setList((prev) => prev.map((x) => (x.id === c.id ? { ...x, member_count: Math.max(0, x.member_count - 1) } : x)));
    toast.success(`Left ${c.name}`);
  };

  const filtered = list.filter((c) =>
    !q ||
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.description.toLowerCase().includes(q.toLowerCase()) ||
    c.topic.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-brand uppercase tracking-wider mb-2">
          <Users size={12} /> Communities
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Pursue goals, together</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Public groups anyone can join. Share progress, swap routines, and stay accountable.
          Different from teams — communities are open and topic-led.
        </p>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-border bg-card/40">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search communities…"
            className="bg-transparent border-0 outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const joined = memberships.has(c.id);
            return (
              <div key={c.id} className="p-4 rounded-xl border border-border bg-card/40 space-y-3 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to="/app/communities/$slug" params={{ slug: c.slug }} className="text-sm font-medium hover:text-brand inline-flex items-center gap-1.5">
                      {c.name}
                      {c.is_official && <BadgeCheck size={12} className="text-brand" />}
                    </Link>
                    <div className="text-[10px] text-muted-foreground capitalize mt-0.5">
                      {TOPIC_LABELS[c.topic] ?? c.topic} · {c.member_count} {c.member_count === 1 ? "member" : "members"}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{c.description}</p>
                <button
                  onClick={() => (joined ? leave(c) : join(c))}
                  className={`w-full text-xs py-1.5 rounded-md transition-colors ${joined ? "bg-muted text-muted-foreground" : "bg-brand text-brand-foreground hover:opacity-90"}`}
                >
                  {joined ? "Joined — leave" : "Join community"}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-xs text-muted-foreground border border-dashed border-border rounded-lg p-6 text-center">
              <Sparkles size={14} className="mx-auto mb-1 opacity-50" />
              No communities match "{q}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}