import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/media")({ component: MediaPage });

interface Item {
  id: string;
  title: string;
  type: "book" | "film" | "show" | "podcast" | "article" | "other";
  status: "want" | "in_progress" | "done";
  rating: number | null;
  notes: string | null;
}

const TYPE_ICON: Record<Item["type"], string> = {
  book: "📖", film: "🎬", show: "📺", podcast: "🎧", article: "📰", other: "✦",
};

const STATUS_LABEL: Record<Item["status"], string> = {
  want: "Not started",
  in_progress: "In progress",
  done: "Done",
};

function MediaPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filterType, setFilterType] = useState<Item["type"] | "all">("all");
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Item["type"]>("book");
  const [active, setActive] = useState<Item | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("media_items").select("id,title,type,status,rating,notes").eq("user_id", user.id).order("created_at", { ascending: false });
      setItems((data as Item[]) ?? []);
    })();
  }, [user]);

  const add = async () => {
    if (!user || !title.trim()) return;
    const { data, error } = await supabase.from("media_items").insert({ user_id: user.id, title: title.trim(), type, status: "want" }).select().single();
    if (error) return toast.error(error.message);
    setItems((c) => [data as Item, ...c]); setTitle(""); setAdding(false);
  };

  const move = async (i: Item, status: Item["status"]) => {
    setItems((c) => c.map((x) => (x.id === i.id ? { ...x, status } : x)));
    await supabase.from("media_items").update({ status }).eq("id", i.id);
  };

  const setRating = async (i: Item, rating: number) => {
    setItems((c) => c.map((x) => (x.id === i.id ? { ...x, rating } : x)));
    if (active?.id === i.id) setActive({ ...i, rating });
    await supabase.from("media_items").update({ rating }).eq("id", i.id);
  };

  const saveNotes = async (i: Item, notes: string) => {
    setItems((c) => c.map((x) => (x.id === i.id ? { ...x, notes } : x)));
    await supabase.from("media_items").update({ notes }).eq("id", i.id);
  };

  const remove = async (id: string) => {
    setItems((c) => c.filter((x) => x.id !== id));
    if (active?.id === id) setActive(null);
    await supabase.from("media_items").delete().eq("id", id);
  };

  const filtered = useMemo(() => filterType === "all" ? items : items.filter((i) => i.type === filterType), [items, filterType]);
  const shelves = useMemo(() => ({
    want: filtered.filter((i) => i.status === "want"),
    in_progress: filtered.filter((i) => i.status === "in_progress"),
    done: filtered.filter((i) => i.status === "done"),
  }), [filtered]);

  return (
    <SquarePageShell title="Media" icon="▶" blurb="Books, films, shows, podcasts." onAdd={() => setAdding(true)} addLabel="Track item">
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilterType("all")} className={`mono text-[10px] uppercase px-3 py-1.5 rounded-md border ${filterType === "all" ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>all</button>
        {(Object.keys(TYPE_ICON) as Item["type"][]).map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={`mono text-[10px] uppercase px-3 py-1.5 rounded-md border ${filterType === t ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{TYPE_ICON[t]} {t}</button>
        ))}
      </div>

      <div className="space-y-6">
        {(["in_progress", "want", "done"] as const).map((status) => (
          <section key={status}>
            <div className="mono text-[10px] uppercase text-muted-foreground mb-2">{STATUS_LABEL[status]} · {shelves[status].length}</div>
            {shelves[status].length === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic">— empty —</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {shelves[status].map((i) => (
                  <button key={i.id} onClick={() => setActive(i)} className="text-left">
                    <Module label={i.type} meta={TYPE_ICON[i.type]} className="hover:border-brand/40 transition-colors">
                      <div className="font-medium truncate">{i.title}</div>
                      <div className="flex items-center gap-1 mt-2">
                        {[1,2,3,4,5].map((n) => (
                          <Star key={n} size={12} className={n <= (i.rating ?? 0) ? "fill-brand text-brand" : "text-muted-foreground/40"} />
                        ))}
                      </div>
                    </Module>
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Detail drawer */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setActive(null)}>
          <div className="w-full max-w-md h-full bg-card border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <div>
                <div className="mono text-[10px] uppercase text-muted-foreground">{active.type}</div>
                <h3 className="font-semibold mt-0.5">{active.title}</h3>
              </div>
              <button onClick={() => remove(active.id)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 size={14} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Status</div>
                <div className="flex gap-1">
                  {(["want", "in_progress", "done"] as const).map((s) => (
                    <button key={s} onClick={() => move(active, s)} className={`flex-1 mono text-[10px] uppercase py-1.5 rounded border ${active.status === s ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground"}`}>{s.replace("_"," ")}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Rating</div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setRating(active, n)}><Star size={20} className={n <= (active.rating ?? 0) ? "fill-brand text-brand" : "text-muted-foreground/40"} /></button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono text-[10px] uppercase text-muted-foreground mb-2">Notes</div>
                <textarea defaultValue={active.notes ?? ""} onBlur={(e) => saveNotes(active, e.target.value)} placeholder="Write your thoughts…" className="w-full min-h-[160px] bg-background border border-border rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Track media</h3>
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Title" className="w-full mb-3 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <select value={type} onChange={(e) => setType(e.target.value as Item["type"])} className="w-full mb-4 bg-background border border-border rounded-md px-3 py-2 text-sm">
              {Object.keys(TYPE_ICON).map((k) => <option key={k} value={k}>{k}</option>)}
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
