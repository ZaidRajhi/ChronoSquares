import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, BadgeCheck, Hash, Plus, Send, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/communities/$slug")({ component: CommunityDetail });

interface Community { id: string; slug: string; name: string; description: string; topic: string; member_count: number; is_official: boolean; }
interface Channel { id: string; community_id: string; name: string; slug: string; description: string; position: number; }
interface Message { id: string; channel_id: string; user_id: string; body: string; created_at: string; is_hidden: boolean; }

// Untyped helpers — community tables aren't in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function CommunityDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load community + channels + membership
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: c } = await sb.from("communities").select("*").eq("slug", slug).maybeSingle();
      if (cancelled) return;
      setCommunity(c);
      if (c) {
        const { data: ch } = await sb.from("community_channels").select("*").eq("community_id", c.id).order("position");
        let list: Channel[] = ch ?? [];
        // Auto-create a #general channel for empty communities (so chat works immediately)
        if (list.length === 0 && user) {
          const { data: created } = await sb.from("community_channels").insert({
            community_id: c.id, name: "general", slug: "general", description: "Main channel", position: 0, created_by: user.id,
          }).select().single();
          if (created) list = [created];
        }
        setChannels(list);
        setActiveChannel(list[0] ?? null);
        if (user) {
          const { data: m } = await sb.from("community_members").select("id").eq("community_id", c.id).eq("user_id", user.id).maybeSingle();
          setJoined(!!m);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user]);

  // Load messages + subscribe to realtime for the active channel
  useEffect(() => {
    if (!activeChannel) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.from("community_messages").select("*").eq("channel_id", activeChannel.id).eq("is_hidden", false).order("created_at", { ascending: true }).limit(200);
      if (!cancelled) setMessages(data ?? []);
    })();
    const channel = supabase.channel(`messages:${activeChannel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_messages", filter: `channel_id=eq.${activeChannel.id}` }, (payload) => {
        setMessages((prev) => prev.some((m) => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [activeChannel]);

  // Auto-scroll to bottom on new messages
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const join = async () => {
    if (!user || !community) { toast.error("Sign in to join"); return; }
    await sb.from("community_members").insert({ community_id: community.id, user_id: user.id });
    setJoined(true);
    setCommunity({ ...community, member_count: community.member_count + 1 });
  };

  const sendMessage = async () => {
    if (!user || !activeChannel || !community) return;
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const { error } = await sb.from("community_messages").insert({ channel_id: activeChannel.id, community_id: community.id, user_id: user.id, body });
    if (error) { toast.error(error.message); setDraft(body); }
  };

  const createChannel = async () => {
    if (!user || !community || !newChannelName.trim()) return;
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    const { data, error } = await sb.from("community_channels").insert({
      community_id: community.id, name, slug: name, description: "", position: channels.length, created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setChannels([...channels, data]); setActiveChannel(data); setNewChannelName(""); setCreatingChannel(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!community) {
    return (
      <div className="text-center space-y-3 py-12">
        <p className="text-sm text-muted-foreground">Community not found.</p>
        <button onClick={() => navigate({ to: "/app/communities" })} className="btn-outline-brand text-xs py-1.5 px-3">Browse communities</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link to="/app/communities" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand">
        <ArrowLeft size={12} /> All communities
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight inline-flex items-center gap-2">
            {community.name}
            {community.is_official && <BadgeCheck size={16} className="text-brand" />}
          </h1>
          <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Users size={11} /> {community.member_count} · {community.topic}
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{community.description}</p>
        </div>
        {!joined ? <button onClick={join} className="btn-brand text-xs py-1.5 px-3">Join</button> : <span className="badge-soft">Joined</span>}
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4 h-[70vh] rounded-xl border border-border overflow-hidden bg-card/30">
        {/* Channel sidebar */}
        <aside className="border-r border-border bg-background/40 flex flex-col">
          <div className="px-3 py-2 mono text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border flex items-center justify-between">
            Channels
            {joined && (
              <button onClick={() => setCreatingChannel((v) => !v)} className="hover:text-brand" title="New channel"><Plus size={11} /></button>
            )}
          </div>
          {creatingChannel && (
            <div className="p-2 border-b border-border space-y-1">
              <input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="channel-name" onKeyDown={(e) => e.key === "Enter" && createChannel()} className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:border-brand" />
              <button onClick={createChannel} className="w-full btn-brand text-[10px] py-1">Create</button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto py-1">
            {channels.map((c) => (
              <button key={c.id} onClick={() => setActiveChannel(c)} className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted/40 ${activeChannel?.id === c.id ? "bg-muted/60 text-brand" : "text-muted-foreground"}`}>
                <Hash size={11} />{c.name}
              </button>
            ))}
            {channels.length === 0 && <p className="px-3 py-2 text-[10px] text-muted-foreground">No channels yet.</p>}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-border text-sm flex items-center gap-1.5"><Hash size={12} className="text-muted-foreground" />{activeChannel?.name ?? "—"}</div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Say hi 👋</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.user_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-3 py-1.5 text-sm ${m.user_id === user?.id ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"}`}>
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="mono text-[9px] opacity-60 mt-0.5">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={joined ? `Message #${activeChannel?.name ?? ""}` : "Join the community to chat"}
              disabled={!joined || !activeChannel}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:border-brand outline-none disabled:opacity-50"
            />
            <button onClick={sendMessage} disabled={!joined || !draft.trim()} className="btn-brand px-3 py-2 text-xs disabled:opacity-50"><Send size={13} /></button>
          </div>
        </section>
      </div>
    </div>
  );
}