import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/PublicShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Store — ChronoSquares" },
      { name: "description", content: "Browse and purchase Notion templates and automation workflows." },
      { property: "og:title", content: "Store — ChronoSquares" },
      { property: "og:description", content: "Browse and purchase Notion templates and automation workflows." },
    ],
  }),
  component: StorePage,
});

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  external_url: string | null;
  image_url: string | null;
  category: string;
}

function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("store_products")
        .select("id, slug, title, description, price_cents, currency, external_url, image_url, category")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicShell>
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">ChronoSquares Store</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Templates, workflows, and tools — built on the same systems thinking as the app.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground">No products yet. Check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {products.map((p) => (
              <div key={p.id} className="hover-tile p-6 flex flex-col">
                <div className="aspect-video rounded-lg bg-secondary/60 mb-5 overflow-hidden flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 w-16">
                      <div className="aspect-square rounded bg-brand/40" />
                      <div className="aspect-square rounded bg-accent/40" />
                      <div className="aspect-square rounded bg-accent/40" />
                      <div className="aspect-square rounded bg-brand/40" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground flex-1">{p.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-semibold text-brand">
                    {p.price_cents === 0 ? "Free" : `${p.currency} ${(p.price_cents / 100).toFixed(2)}`}
                  </span>
                  {(p as { coming_soon?: boolean }).coming_soon ? (
                    <span className="badge-soft">Coming soon</span>
                  ) : p.external_url ? (
                    <a href={p.external_url} target="_blank" rel="noreferrer" className="btn-brand text-xs py-1.5 px-3">
                      Get it <ArrowRight size={13} />
                    </a>
                  ) : (
                    <span className="badge-soft">Available soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
