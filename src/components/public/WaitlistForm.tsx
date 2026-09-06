import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        setDone(true);
        toast.success("You're already on the list — see you soon.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }
    setDone(true);
    toast.success("You're on the list. We'll be in touch.");
  };

  if (done) {
    return (
      <div className="hover-tile p-6 text-center">
        <p className="text-base font-medium">You're on the waitlist.</p>
        <p className="text-sm text-muted-foreground mt-1">We'll send you an invite the moment we're ready.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        placeholder="you@domain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-md bg-card border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button type="submit" className="btn-brand text-sm" disabled={loading}>
        {loading && <Loader2 size={14} className="animate-spin" />}
        Join Waitlist
      </button>
    </form>
  );
}
