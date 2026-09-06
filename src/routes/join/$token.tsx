import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CSLogo } from "@/components/CSLogo";

export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Join workspace — ChronoSquares" },
      { name: "description", content: "Join a ChronoSquares delivery workspace." },
    ],
  }),
  component: JoinWorkspacePage,
});

function JoinWorkspacePage() {
  const { token } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"waiting" | "accepting" | "accepted" | "error">("waiting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.sessionStorage.setItem("chronosquares-invite-token", token);
      window.location.assign("/login");
      return;
    }

    let cancelled = false;
    setStatus("accepting");
    const deliveryDb = supabase as unknown as { rpc: (name: string, args: Record<string, string>) => Promise<{ error: { message: string } | null }> };
    void deliveryDb.rpc("delivery_accept_invitation", { invite_token: token }).then(({ error }) => {
      if (cancelled) return;
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("accepted");
        setMessage("Your account now has access to the delivery workspace.");
      }
    });

    return () => { cancelled = true; };
  }, [authLoading, token, user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-10"><CSLogo /></Link>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
        {status === "accepting" && <Loader2 size={24} className="mx-auto text-brand animate-spin" />}
        {status === "accepted" && <CheckCircle2 size={28} className="mx-auto text-brand" />}
        <h1 className="text-2xl font-bold tracking-tight mt-4">
          {status === "error" ? "Invitation unavailable" : status === "accepted" ? "You’re in" : "Joining workspace"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === "error" ? message : status === "accepted" ? message : "We’re checking your invitation and assigning the correct workspace role."}
        </p>
        {status === "accepted" && <Link to="/app/dashboard" className="btn-brand inline-flex mt-6">Open workspace</Link>}
        {status === "error" && <Link to="/app/dashboard" className="btn-outline-brand inline-flex mt-6">Go to app</Link>}
      </div>
    </div>
  );
}