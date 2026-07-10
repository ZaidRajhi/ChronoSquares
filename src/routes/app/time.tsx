import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/time")({ component: TimePage });

interface Block {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: "work" | "personal" | "health" | "learning" | "social" | "other";
  rating: "productive" | "neutral" | "wasted" | null;
}

const CAT_COLOUR: Record<Block["category"], string> = {
  work: "bg-brand/40 border-brand/60",
  personal: "bg-purple-500/30 border-purple-500/60",
  health: "bg-emerald-500/30 border-emerald-500/60",
  learning: "bg-amber-500/30 border-amber-500/60",
  social: "bg-pink-500/30 border-pink-500/60",
  other: "bg-muted border-border",
};

const RATING_LABEL: Record<NonNullable<Block["rating"]>, string> = {
  productive: "🔥",
  neutral: "•",
  wasted: "💤",
};

function TimePage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dayRating, setDayRating] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", start: "09:00", end: "10:00", category: "work" as Block["category"] });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
      const todayStr = today.toISOString().slice(0, 10);
      const [{ data: bl }, { data: dr }] = await Promise.all([
        supabase.from("time_blocks").select("*").eq("user_id", user.id).gte("start_time", weekAgo.toISOString()).order("start_time"),
        supabase.from("time_day_ratings").select("rating").eq("user_id", user.id).eq("day", todayStr).maybeSingle(),
      ]);
      setBlocks((bl as Block[]) ?? []);
      setDayRating(dr?.rating ?? null);
    })();
  }, [user]);

  const add = async () => {
    if (!user || !form.title.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from("time_blocks").insert({
      user_id: user.id, title: form.title, category: form.category,
      start_time: `${today}T${form.start}:00`,
      end_time: `${today}T${form.end}:00`,
    }).select().single();
    if (error) return toast.error(error.message);
    setBlocks((c) => [...c, data as Block]);
    setForm({ title: "", start: "09:00", end: "10:00", category: "work" }); setAdding(false);
  };

  const totalHrs = blocks.reduce((a, b) => a + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3_600_000, 0);
  const todayBlocks = useMemo(() => blocks.filter((b) => new Date(b.start_time).toDateString() === new Date().toDateString()), [blocks]);

  const setRating = async (b: Block, rating: Block["rating"]) => {
    setBlocks((c) => c.map((x) => (x.id === b.id ? { ...x, rating } : x)));
    await supabase.from("time_blocks").update({ rating }).eq("id", b.id);
  };

  const removeBlock = async (id: string) => {
    setBlocks((c) => c.filter((b) => b.id !== id));
    await supabase.from("time_blocks").delete().eq("id", id);
  };

  const setDay = async (rating: string) => {
    if (!user) return;
    setDayRating(rating);
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase.from("time_day_ratings").select("id").eq("user_id", user.id).eq("day", today).maybeSingle();
    if (existing) {
      await supabase.from("time_day_ratings").update({ rating }).eq("id", existing.id);
    } else {
      await supabase.from("time_day_ratings").insert({ user_id: user.id, day: today, rating });
    }
  };

  return (
    <SquarePageShell title="Time" icon="⏱" blurb="Block, log, rate." onAdd={() => setAdding(true)} addLabel="Add block">
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Module label="This week" meta="hours"><div className="text-2xl font-semibold text-brand">{totalHrs.toFixed(1)}h</div></Module>
        <Module label="Blocks" meta="count"><div className="text-2xl font-semibold">{blocks.length}</div></Module>
        <Module label="Today" meta={new Date().toLocaleDateString()}>
          <div className="text-2xl font-semibold">{todayBlocks.length}</div>
          <div className="flex gap-1 mt-2">
            {(["productive", "neutral", "wasted"] as const).map((r) => (
              <button key={r} onClick={() => setDay(r)} className={`flex-1 mono text-[10px] uppercase py-1 rounded border ${dayRating === r ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{r}</button>
            ))}
          </div>
        </Module>
      </div>

      <Module label="Today timeline" meta={`${todayBlocks.length} blocks`} className="mb-4">
        <DayTimeline blocks={todayBlocks} />
      </Module>

      <Module label="All blocks" meta="this week">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time blocks yet.</p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className={`px-3 py-2 rounded-md border text-sm group ${CAT_COLOUR[b.category]}`}>
                <div className="flex items-center gap-3">
                  <span className="font-medium flex-1">{b.title}</span>
                  <div className="flex gap-1">
                    {(["productive", "neutral", "wasted"] as const).map((r) => (
                      <button key={r} onClick={() => setRating(b, b.rating === r ? null : r)} className={`size-6 rounded text-xs ${b.rating === r ? "bg-foreground/20 ring-1 ring-foreground/30" : "hover:bg-foreground/10"}`} title={r}>{RATING_LABEL[r]}</button>
                    ))}
                  </div>
                  <span className="mono text-[10px]">{new Date(b.start_time).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })} → {new Date(b.end_time).toLocaleString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <button onClick={() => removeBlock(b.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 size={12} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Module>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New block</h3>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus placeholder="What" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input type="time" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
              <input type="time" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} className="bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </div>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Block["category"] }))} className="w-full mb-4 bg-background border border-border rounded-md px-3 py-2 text-sm">
              {Object.keys(CAT_COLOUR).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
              <button onClick={add} className="btn-brand text-xs py-1.5 px-3">Add</button>
            </div>
          </div>
        </div>
      )}
    </SquarePageShell>
  );
}

function DayTimeline({ blocks }: { blocks: Block[] }) {
  // 24-hour vertical strip, 6am to midnight
  const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 6 → 24
  const startHour = 6;
  const totalHours = 18;
  const HOUR_PX = 28;
  const containerH = totalHours * HOUR_PX;
  return (
    <div className="relative" style={{ height: containerH }}>
      {HOURS.map((h) => (
        <div key={h} className="absolute left-0 right-0 flex items-start gap-2" style={{ top: (h - startHour) * HOUR_PX }}>
          <span className="mono text-[10px] text-muted-foreground w-8 -translate-y-1.5">{String(h).padStart(2, "0")}:00</span>
          <div className="flex-1 border-t border-dashed border-border/40 -translate-y-px" />
        </div>
      ))}
      {blocks.map((b) => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        const startMinutes = start.getHours() * 60 + start.getMinutes() - startHour * 60;
        const durMinutes = (end.getTime() - start.getTime()) / 60000;
        const top = (startMinutes / 60) * HOUR_PX;
        const h = (durMinutes / 60) * HOUR_PX;
        if (top < 0 || top > containerH) return null;
        return (
          <div key={b.id} className={`absolute left-12 right-2 rounded-md border px-2 py-1 overflow-hidden text-xs ${CAT_COLOUR[b.category]}`} style={{ top, height: Math.max(20, h) }}>
            <div className="font-medium truncate">{b.title}</div>
            <div className="mono text-[9px] opacity-70">{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        );
      })}
    </div>
  );
}
