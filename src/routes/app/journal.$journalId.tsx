import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/app/journal/$journalId")({ component: JournalDetail });

interface Entry {
  id: string;
  entry_date: string;
  content: string;
  mood: string | null;
  tags: string[];
}

const MOODS = ["😍", "🙂", "😐", "😕", "😞"];

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

function JournalDetail() {
  const { user } = useAuth();
  const { journalId } = Route.useParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<Entry | null>(null);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [journalName, setJournalName] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: j }, { data: es }] = await Promise.all([
        supabase.from("journals").select("name").eq("id", journalId).maybeSingle(),
        supabase.from("journal_entries").select("*").eq("journal_id", journalId).order("entry_date", { ascending: false }),
      ]);
      setJournalName(j?.name ?? "Journal");
      const list = (es as Entry[]) ?? [];
      setEntries(list);
      if (list.length > 0) {
        setActive(list[0]); setContent(list[0].content); setMood(list[0].mood); setTags(list[0].tags ?? []);
      }
    })();
  }, [user, journalId]);

  // Autosave on content/mood/tags change
  useEffect(() => {
    if (!active) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(async () => {
      await supabase.from("journal_entries").update({ content, mood, tags }).eq("id", active.id);
      setEntries((c) => c.map((x) => (x.id === active.id ? { ...x, content, mood, tags } : x)));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, mood, tags]);

  const openOrCreateForDate = async (date: string) => {
    const found = entries.find((e) => e.entry_date === date);
    if (found) { setActive(found); setContent(found.content); setMood(found.mood); setTags(found.tags ?? []); return; }
    if (!user) return;
    const { data, error } = await supabase.from("journal_entries").insert({
      user_id: user.id, journal_id: journalId, entry_date: date, content: "", mood: null, tags: [],
    }).select().single();
    if (error) return toast.error(error.message);
    const e = data as Entry;
    setEntries((c) => [e, ...c].sort((a, b) => b.entry_date.localeCompare(a.entry_date)));
    setActive(e); setContent(""); setMood(null); setTags([]);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    setTags((cur) => [...cur, t]); setTagInput("");
  };

  // Build last-30-day calendar strip
  const today = new Date();
  const strip = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (29 - i));
    return ymd(d);
  });
  const entryDates = new Set(entries.map((e) => e.entry_date));

  return (
    <div>
      <Link to="/app/journal" className="mono text-[10px] text-muted-foreground hover:text-brand">← all journals</Link>
      <div className="flex items-start justify-between gap-4 mb-4 mt-1">
        <h1 className="text-2xl font-semibold tracking-tight"><span className="text-brand">✎</span> {journalName}</h1>
        <button onClick={() => openOrCreateForDate(ymd(today))} className="btn-brand text-xs py-1.5 px-3">+ Entry today</button>
      </div>

      {/* Calendar strip */}
      <Module label="Last 30 days" meta={`${entries.length} entries`}>
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
          {strip.map((d) => {
            const has = entryDates.has(d);
            const isActive = active?.entry_date === d;
            const day = new Date(d);
            return (
              <button
                key={d}
                onClick={() => openOrCreateForDate(d)}
                className={`shrink-0 size-12 rounded-md flex flex-col items-center justify-center border transition-colors ${isActive ? "border-brand bg-brand/15 text-brand" : has ? "border-brand/40 bg-brand/5 text-foreground" : "border-border text-muted-foreground hover:border-brand/40"}`}
                title={d}
              >
                <span className="mono text-[9px] uppercase">{day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</span>
                <span className="text-sm font-medium leading-none mt-0.5">{day.getDate()}</span>
              </button>
            );
          })}
        </div>
      </Module>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 mt-4">
        <Module label="Entries" meta={`${entries.length}`}>
          <ul className="divide-y divide-border/60 -mx-2 max-h-[60vh] overflow-y-auto">
            {entries.map((e) => (
              <li key={e.id}>
                <button onClick={() => { setActive(e); setContent(e.content); setMood(e.mood); setTags(e.tags ?? []); }}
                  className={`w-full text-left px-2 py-2 hover:bg-muted/40 rounded ${active?.id === e.id ? "bg-muted/60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[11px] text-brand">{e.entry_date}</span>
                    {e.mood && <span>{e.mood}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{e.content || "(empty)"}</div>
                  {e.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {e.tags.slice(0, 3).map((t) => <span key={t} className="mono text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>)}
                    </div>
                  )}
                </button>
              </li>
            ))}
            {entries.length === 0 && <li className="text-sm text-muted-foreground p-2">No entries yet.</li>}
          </ul>
        </Module>

        <Module label="Editor" meta={active?.entry_date ?? "—"}>
          {active ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                  {MOODS.map((m) => (
                    <button key={m} onClick={() => setMood(m === mood ? null : m)} className={`size-9 rounded-md border text-lg ${mood === m ? "border-brand bg-brand/10" : "border-border hover:border-brand/40"}`}>{m}</button>
                  ))}
                </div>
                <div className="mono text-[10px] uppercase text-muted-foreground flex items-center gap-1.5">
                  {saveState === "saving" && <><Loader2 size={11} className="animate-spin" /> saving</>}
                  {saveState === "saved" && <><Check size={11} className="text-brand" /> saved</>}
                  {saveState === "idle" && <span>autosave on</span>}
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What happened today? What did you feel? What did you learn?"
                className="w-full min-h-[260px] bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />

              {/* Tags */}
              <div className="mt-3">
                <div className="mono text-[10px] uppercase text-muted-foreground mb-1.5">Tags</div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 mono text-[10px] px-2 py-1 rounded bg-brand/10 text-brand border border-brand/30">
                      #{t}
                      <button onClick={() => setTags((c) => c.filter((x) => x !== t))} className="hover:text-foreground"><X size={10} /></button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    placeholder="add tag…"
                    className="text-xs bg-transparent border-b border-border focus:border-brand outline-none px-1 py-0.5 w-24"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tap a day in the strip above to start writing.</p>
          )}
        </Module>
      </div>
    </div>
  );
}
