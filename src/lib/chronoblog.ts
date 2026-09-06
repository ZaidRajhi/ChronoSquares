import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BlogPostRow = Database["public"]["Tables"]["blog_posts"]["Row"];

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  tags: string[];
  readMinutes: number;
  publishedAt: string;
};

/** Map a `blog_posts` row (body stored as text, paragraphs split by blank lines). */
function mapPostToArticle(row: BlogPostRow): Article {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    tags: row.tags ?? [],
    readMinutes: row.read_minutes,
    publishedAt: (row.published_at ?? row.created_at).slice(0, 10),
  };
}

/** All published articles, newest first. */
export async function fetchArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(mapPostToArticle);
}

/** The most recent published articles. */
export async function fetchLatestArticles(limit: number): Promise<Article[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapPostToArticle);
}

/** One published article by slug, or null. */
export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPostToArticle(data) : null;
}
