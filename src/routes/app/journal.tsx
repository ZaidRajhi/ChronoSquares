import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SquarePageShell } from "@/components/app/SquarePageShell";
import { Module } from "@/components/app/Module";
import { toast } from "sonner";

export const Route = createFileRoute("/app/journal")({ component: JournalPage });

interface Journal {
  id: string;
  name: string;
  colour: string;
  icon: string;
}

interface JournalWithMeta extends Journal {
  entry_count: number;
  last_entry: string | null;
}

function JournalPage() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalWithMeta[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📓");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("journals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const list = (data as Journal[]) ?? [];
      // Hydrate counts + last entry per journal
      const meta = await Promise.all(list.map(async (j) => {
        const { data: last } = await supabase
          .from("journal_entries").select("entry_date")
          .eq("journal_id", j.id).order("entry_date", { ascending: false }).limit(1).maybeSingle();
        const { count } = await supabase
          .from("journal_entries").select("*", { count: "exact", head: true })
          .eq("journal_id", j.id);
        return { ...j, entry_count: count ?? 0, last_entry: (last as { entry_date: string } | null)?.entry_date ?? null };
      }));
      setJournals(meta);
    })();
  }, [user]);

  const add = async () => {
    if (!user || !name.trim()) return;
    const { data, error } = await supabase.from("journals").insert({ user_id: user.id, name: name.trim(), icon, colour: "#34d399" }).select().single();
    if (error) return toast.error(error.message);
    setJournals((c) => [{ ...(data as Journal), entry_count: 0, last_entry: null }, ...c]);
    setName(""); setAdding(false);
  };

  return (
    <SquarePageShell title="Journal" icon="✎" blurb="Reflect & remember." onAdd={() => setAdding(true)} addLabel="New journal">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {journals.map((j) => (
          <Link key={j.id} to="/app/journal/$journalId" params={{ journalId: j.id }} className="block">
            <Module label="journal" meta={j.icon}>
              <div className="font-medium text-lg">{j.name}</div>
              <div className="flex items-center justify-between mt-2 mono text-[10px] text-muted-foreground">
                <span>{j.entry_count} {j.entry_count === 1 ? "entry" : "entries"}</span>
                <span>{j.last_entry ? `last · ${j.last_entry}` : "empty"}</span>
              </div>
            </Module>
          </Link>
        ))}
        {journals.length === 0 && <p className="text-sm text-muted-foreground col-span-full">No journals yet. Create one to start writing.</p>}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="module max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">New journal</h3>
            <label className="mono text-[10px] uppercase text-muted-foreground">Icon</label>
            <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} className="w-full mb-3 mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
            <label className="mono text-[10px] uppercase text-muted-foreground">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Morning Pages" className="w-full mb-4 mt-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
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
