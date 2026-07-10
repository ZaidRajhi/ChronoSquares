import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Save } from "lucide-react";

export const Route = createFileRoute("/app/admin/blog")({
  component: AdminBlog,
});

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  read_minutes: number;
  published: boolean;
  published_at: string | null;
}

const empty: Omit<Post, "id"> = {
  slug: "", title: "", excerpt: "", body: "", tags: [], read_minutes: 5, published: false, published_at: null,
};

function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!editing?.title || !editing?.slug) { toast.error("Title and slug are required"); return; }
    const payload = {
      slug: editing.slug,
      title: editing.title,
      excerpt: editing.excerpt ?? "",
      body: editing.body ?? "",
      tags: editing.tags ?? [],
      read_minutes: editing.read_minutes ?? 5,
      published: editing.published ?? false,
      published_at: editing.published ? (editing.published_at ?? new Date().toISOString()) : null,
    };
    const { error } = editing.id
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEditing(null);
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    reload();
  };

  const togglePublish = async (p: Post) => {
    await supabase.from("blog_posts").update({
      published: !p.published,
      published_at: !p.published ? new Date().toISOString() : p.published_at,
    }).eq("id", p.id);
    reload();
  };

  if (editing) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{editing.id ? "Edit post" : "New post"}</h2>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="btn-outline-brand text-xs py-1.5 px-3">Cancel</button>
            <button onClick={save} className="btn-brand text-xs py-1.5 px-3"><Save size={13} /> Save</button>
          </div>
        </div>
        <div className="space-y-3">
          <Field label="Title">
            <input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Slug (URL)">
            <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} className={inputCls} />
          </Field>
          <Field label="Excerpt">
            <textarea value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} className={`${inputCls} h-20`} />
          </Field>
          <Field label="Body (paragraphs separated by blank lines)">
            <textarea value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className={`${inputCls} h-80 font-mono text-xs`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tags (comma-separated)">
              <input
                value={(editing.tags ?? []).join(", ")}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                className={inputCls}
              />
            </Field>
            <Field label="Read time (minutes)">
              <input type="number" value={editing.read_minutes ?? 5} onChange={(e) => setEditing({ ...editing, read_minutes: Number(e.target.value) })} className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.published ?? false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} className="accent-brand" />
            Published
          </label>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{posts.length} posts</h2>
        <button onClick={() => setEditing(empty)} className="btn-brand text-xs py-1.5 px-3"><Plus size={13} /> New post</button>
      </div>
      {loading ? <p className="text-muted-foreground text-sm">Loading…</p> : (
        <div className="border border-border rounded-2xl overflow-hidden">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{p.title}</span>
                  {!p.published && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Draft</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">/{p.slug} · {p.read_minutes} min · {p.tags.join(", ")}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePublish(p)} className="p-2 rounded-md hover:bg-muted text-muted-foreground" title={p.published ? "Unpublish" : "Publish"}>
                  {p.published ? <Eye size={14} /> : <EyeOff size={14} />}
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
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
