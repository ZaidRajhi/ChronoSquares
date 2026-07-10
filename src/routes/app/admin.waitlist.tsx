import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/admin/waitlist")({
  component: AdminWaitlist,
});

interface Entry { id: string; email: string; created_at: string; agency_name?: string | null; }

function AdminWaitlist() {
  const [chrono, setChrono] = useState<Entry[]>([]);
  const [flow, setFlow] = useState<Entry[]>([]);

  useEffect(() => {
    (async () => {
      const [c, f] = await Promise.all([
        supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
        supabase.from("flowgrid_waitlist").select("*").order("created_at", { ascending: false }),
      ]);
      setChrono((c.data as Entry[]) ?? []);
      setFlow((f.data as Entry[]) ?? []);
    })();
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <List title="ChronoSquares Mailing List" entries={chrono} />
      <List title="FlowGrid Mailing List" entries={flow} showAgency />
    </div>
  );
}

function List({ title, entries, showAgency }: { title: string; entries: Entry[]; showAgency?: boolean }) {
  return (
    <div>
      <h2 className="font-semibold mb-3">{title} <span className="text-muted-foreground text-sm font-normal">({entries.length})</span></h2>
      <div className="border border-border rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
        {entries.length === 0 && <div className="p-4 text-sm text-muted-foreground">No signups yet.</div>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-3 border-b border-border last:border-b-0 text-sm hover:bg-muted/40">
            <div className="min-w-0">
              <div className="truncate">{e.email}</div>
              {showAgency && e.agency_name && <div className="text-xs text-muted-foreground">{e.agency_name}</div>}
            </div>
            <div className="text-xs text-muted-foreground shrink-0 ml-3">
              {new Date(e.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
