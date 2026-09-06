import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function FlowgridWaitlistForm() {
  const [email, setEmail] = useState("");
  const [agency, setAgency] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !agency.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from("flowgrid_waitlist")
      .insert({ email: email.trim().toLowerCase(), agency_name: agency.trim() });
    setLoading(false);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Welcome to the FlowGrid waitlist.");
  };

  if (done) {
    return (
      <div className="hover-tile p-6 text-center max-w-lg mx-auto">
        <p className="text-base font-medium">You're on the FlowGrid waitlist.</p>
        <p className="text-sm text-muted-foreground mt-1">
          We'll reach out as launch approaches with early access details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
      <input
        type="email"
        required
        placeholder="you@agency.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md bg-card border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <input
        type="text"
        required
        placeholder="Agency name"
        value={agency}
        onChange={(e) => setAgency(e.target.value)}
        className="rounded-md bg-card border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button type="submit" className="btn-brand text-sm sm:col-span-2" disabled={loading}>
        {loading && <Loader2 size={14} className="animate-spin" />}
        Join the Waitlist
      </button>
    </form>
  );
}
