import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, ShoppingBag, Mail } from "lucide-react";

export const Route = createFileRoute("/app/admin/")({
  component: AdminOverview,
});

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string | number; accent: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`size-9 rounded-lg flex items-center justify-center mb-3 ${accent}`}><Icon size={16} /></div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, posts: 0, products: 0, waitlist: 0, flowgrid: 0 });

  useEffect(() => {
    (async () => {
      const [u, p, pr, w, f] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("store_products").select("id", { count: "exact", head: true }),
        supabase.from("waitlist").select("id", { count: "exact", head: true }),
        supabase.from("flowgrid_waitlist").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: u.count ?? 0,
        posts: p.count ?? 0,
        products: pr.count ?? 0,
        waitlist: w.count ?? 0,
        flowgrid: f.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard icon={Users} label="Users" value={stats.users} accent="bg-brand/10 text-brand" />
      <StatCard icon={FileText} label="Blog Posts" value={stats.posts} accent="bg-brand-violet/15 text-brand-violet" />
      <StatCard icon={ShoppingBag} label="Products" value={stats.products} accent="bg-amber-500/10 text-amber-600" />
      <StatCard icon={Mail} label="Waitlist" value={stats.waitlist} accent="bg-rose-500/10 text-rose-600" />
      <StatCard icon={Mail} label="FlowGrid" value={stats.flowgrid} accent="bg-sky-500/10 text-sky-600" />
    </div>
  );
}
