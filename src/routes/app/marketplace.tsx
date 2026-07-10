import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useOverlays } from "@/lib/useOverlays";
import { MarketplaceOverlayCard } from "@/components/app/OverlaysPicker";
import { ADDON_SQUARES } from "@/lib/squares";
import { Sparkles, Layers, Boxes, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/marketplace")({ component: MarketplacePage });

type Tab = "overlays" | "squares" | "community";

function MarketplacePage() {
  const [tab, setTab] = useState<Tab>("overlays");
  const { catalogue, owned, acquire } = useOverlays();
  const ownedIds = new Set(owned.map((o) => o.overlay_id));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-brand uppercase tracking-wider mb-2">
          <Sparkles size={12} /> Marketplace
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Extend your ChronoSquares</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Skin your workspace with overlays, add new mini-apps with Squares, or browse community templates.
          Free items are added instantly. Paid items require Personal or Business plans.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabBtn active={tab === "overlays"} onClick={() => setTab("overlays")} icon={Layers}>Overlays</TabBtn>
        <TabBtn active={tab === "squares"} onClick={() => setTab("squares")} icon={Boxes}>Add-on Squares</TabBtn>
        <TabBtn active={tab === "community"} onClick={() => setTab("community")} icon={Users}>Community</TabBtn>
      </div>

      {tab === "overlays" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogue.map((o) => (
            <MarketplaceOverlayCard
              key={o.id}
              overlay={o}
              owned={ownedIds.has(o.id)}
              onAcquire={async () => {
                try { await acquire(o); toast.success(`${o.name} added to your library`); }
                catch { toast.error("Couldn't add overlay"); }
              }}
            />
          ))}
        </div>
      )}

      {tab === "squares" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADDON_SQUARES.map((s) => (
            <div key={s.slug} className="p-5 rounded-xl border border-border bg-card/40 space-y-3">
              <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-2xl">{s.icon}</div>
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.blurb}</p>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Personal Square · Beta</div>
              <button className="w-full text-xs py-1.5 rounded-md bg-brand text-brand-foreground opacity-60 cursor-default">Coming soon</button>
            </div>
          ))}
          {/* Business Squares teaser */}
          {[
            { name: "Onboarding System", icon: "🪪", blurb: "Client/staff onboarding pipelines." },
            { name: "Team Chats", icon: "💬", blurb: "Channels & DMs inside your workspace." },
          ].map((s) => (
            <div key={s.name} className="p-5 rounded-xl border border-border bg-card/40 space-y-3">
              <div className="size-12 rounded-lg bg-muted flex items-center justify-center text-2xl">{s.icon}</div>
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.blurb}</p>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Business Square</div>
              <button className="w-full text-xs py-1.5 rounded-md border border-border text-muted-foreground cursor-default">Requires Business plan</button>
            </div>
          ))}
        </div>
      )}

      {tab === "community" && (
        <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <Users size={32} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium">Community Marketplace coming soon</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Build your own Squares, Overlays, and Workflow templates — earn revenue when others install yours.
          </p>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 -mb-px border-b-2 text-sm transition-colors flex items-center gap-2 ${active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      <Icon size={14} /> {children}
    </button>
  );
}