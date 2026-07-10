import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/preview")({
  component: AdminPreview,
});

const PLANS = [
  { value: "free", label: "Free", desc: "3 Squares. Basic Workflow Layer. Limited AI." },
  { value: "starter", label: "Starter", desc: "All 7 Squares. Full Workflow. Standard AI." },
  { value: "pro", label: "Pro", desc: "Everything in Starter + add-ons (Gamification, Email)." },
  { value: "team", label: "Team", desc: "Pro + Team Tasks Square + collaboration." },
];

function AdminPreview() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("testing_plan, plan").eq("id", user.id).single();
      setCurrent(data?.testing_plan || data?.plan || "free");
      setLoading(false);
    })();
  }, [user]);

  const setPlan = async (plan: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ testing_plan: plan }).eq("id", user.id);
    setCurrent(plan);
    toast.success(`Previewing as ${plan}`);
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted-foreground mb-5">
        Switch the plan you see the app as — useful for testing how each tier looks and behaves.
        Your real billing plan is unaffected.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {PLANS.map((p) => {
          const active = current === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setPlan(p.value)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                active ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-border hover:border-brand/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.label}</span>
                {active && <span className="text-xs text-brand">Active</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{p.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
