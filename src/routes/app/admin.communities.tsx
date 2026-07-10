import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, Clock, EyeOff, Hash, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/communities")({ component: AdminCommunities });

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  topic: string;
  member_count: number;
  is_official: boolean;
  is_approved: boolean;
  created_at: string;
}

function AdminCommunities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const db = supabase as unknown as { from: (table: string) => { select: (columns: string, opts?: object) => any } };
      const { data } = await db.from("communities").select("*").order("created_at", { ascending: false }) as { data: Community[] | null };
      const { data: channels } = await db.from("community_channels").select("community_id") as { data: { community_id: string }[] | null };
      setCommunities(data ?? []);
      setChannelCounts((channels ?? []).reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.community_id]: (acc[c.community_id] ?? 0) + 1 }), {}));
    })();
  }, []);

  const grouped = useMemo(() => ({
    pending: communities.filter((c) => !c.is_approved),
    live: communities.filter((c) => c.is_approved),
  }), [communities]);

  const setApproved = async (community: Community, approved: boolean) => {
    setCommunities((cur) => cur.map((c) => c.id === community.id ? { ...c, is_approved: approved } : c));
    const { error } = await (supabase.from("communities" as never) as unknown as { update: (patch: object) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } })
      .update({ is_approved: approved }).eq("id", community.id);
    if (error) toast.error(error.message);
    else toast.success(approved ? "Community approved" : "Community hidden");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-brand uppercase tracking-wider mb-2"><Users size={12} /> Communities</div>
        <h2 className="text-xl font-semibold tracking-tight">Community approvals</h2>
        <p className="text-sm text-muted-foreground mt-1">Approve user-created communities and monitor live groups, channels, and membership.</p>
      </div>

      <AdminCommunitySection title="Pending review" icon={<Clock size={13} />} communities={grouped.pending} channelCounts={channelCounts} onApprove={setApproved} />
      <AdminCommunitySection title="Live communities" icon={<BadgeCheck size={13} />} communities={grouped.live} channelCounts={channelCounts} onApprove={setApproved} />
    </div>
  );
}

function AdminCommunitySection({ title, icon, communities, channelCounts, onApprove }: { title: string; icon: React.ReactNode; communities: Community[]; channelCounts: Record<string, number>; onApprove: (c: Community, approved: boolean) => void }) {
  return (
    <section className="space-y-3">
      <div className="mono text-[10px] uppercase text-muted-foreground flex items-center gap-1.5">{icon}{title} · {communities.length}</div>
      <div className="space-y-2">
        {communities.map((c) => (
          <div key={c.id} className="module p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-medium truncate">{c.name}</span>{c.is_official && <BadgeCheck size={13} className="text-brand" />}</div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.description}</p>
              <div className="mono text-[9px] uppercase text-muted-foreground mt-2 flex gap-3"><span>{c.topic}</span><span>{c.member_count} members</span><span className="inline-flex items-center gap-1"><Hash size={10} />{channelCounts[c.id] ?? 0} channels</span></div>
            </div>
            <Link to="/app/communities/$slug" params={{ slug: c.slug }} className="btn-outline-brand text-xs py-1.5 px-3">Open</Link>
            <button onClick={() => onApprove(c, !c.is_approved)} className={c.is_approved ? "btn-outline-brand text-xs py-1.5 px-3" : "btn-brand text-xs py-1.5 px-3"}>{c.is_approved ? <><EyeOff size={12} /> Hide</> : "Approve"}</button>
          </div>
        ))}
        {communities.length === 0 && <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">Nothing here.</div>}
      </div>
    </section>
  );
}