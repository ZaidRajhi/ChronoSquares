import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/app/admin/store")({
  component: AdminStore,
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
  is_active: boolean;
  coming_soon: boolean;
}

const empty: Omit<Product, "id"> = {
  slug: "", title: "", description: "", price_cents: 0, currency: "USD",
  external_url: null, image_url: null, category: "template", is_active: true, coming_soon: false,
};

function AdminStore() {
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("store_products").select("*").order("created_at", { ascending: false });
    setItems((data as Product[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!editing?.title || !editing?.slug) { toast.error("Title and slug required"); return; }
    const payload = {
      slug: editing.slug,
      title: editing.title,
      description: editing.description ?? "",
      price_cents: editing.price_cents ?? 0,
      currency: editing.currency ?? "USD",
      external_url: editing.external_url || null,
      image_url: editing.image_url || null,
      category: editing.category ?? "template",
      is_active: editing.is_active ?? true,
      coming_soon: editing.coming_soon ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("store_products").update(payload).eq("id", editing.id)
      : await supabase.from("store_products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditing(null);
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("store_products").delete().eq("id", id);
    reload();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("store_products").update({ is_active: !p.is_active }).eq("id", p.id);
    reload();
  };

  if (editing) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{editing.id ? "Edit product" : "New product"}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
            <button onClick={save} className="btn-brand text-xs py-1.5 px-3"><Save size={13} /> Save</button>
          </div>
        </div>
        <div className="space-y-3">
          <Field label="Title"><input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} /></Field>
          <Field label="Slug"><input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className={inputCls} /></Field>
          <Field label="Description"><textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={`${inputCls} h-32`} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (cents)"><input type="number" value={editing.price_cents ?? 0} onChange={(e) => setEditing({ ...editing, price_cents: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Currency"><input value={editing.currency ?? "USD"} onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })} className={inputCls} /></Field>
            <Field label="Category">
              <select value={editing.category ?? "template"} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls}>
                <option value="template">Template</option>
                <option value="course">Course</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="External URL (Gumroad, Notion, etc.)"><input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} className={inputCls} /></Field>
          <Field label="Image URL"><input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={inputCls} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="accent-brand" />
            Active (visible in store)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.coming_soon ?? false} onChange={(e) => setEditing({ ...editing, coming_soon: e.target.checked })} className="accent-brand" />
            Coming soon (show "Coming soon" badge instead of buy link)
          </label>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{items.length} products</h2>
        <button onClick={() => setEditing(empty)} className="btn-brand text-xs py-1.5 px-3"><Plus size={13} /> New product</button>
      </div>
      {loading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
        <div className="border border-border rounded-2xl overflow-hidden">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{p.title}</span>
                  {!p.is_active && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.currency} {(p.price_cents / 100).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(p)} className="p-2 rounded-md hover:bg-muted text-muted-foreground">
                  {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => setEditing(p)} className="text-xs text-brand hover:underline px-2">Edit</button>
                <button onClick={() => remove(p.id)} className="p-2 rounded-md hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium text-muted-foreground">{label}</label><div className="mt-1.5">{children}</div></div>;
}
