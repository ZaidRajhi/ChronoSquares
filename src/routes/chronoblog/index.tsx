import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { PublicShell } from "@/components/public/PublicShell";
import { ArrowRight, Search, X, Clock, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ARTICLES, ALL_TAGS } from "@/lib/chronoblog-articles";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  tag: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["newest", "oldest", "longest", "shortest"]), "newest").default("newest"),
});

export const Route = createFileRoute("/chronoblog/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "ChronoBlog — ChronoSquares" },
      { name: "description", content: "Productivity systems, tools, and thinking." },
      { property: "og:title", content: "ChronoBlog — ChronoSquares" },
      { property: "og:description", content: "Productivity systems, tools, and thinking." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { q, tag, sort } = Route.useSearch();
  const navigate = useNavigate();

  type SearchState = { q: string; tag: string; sort: typeof sort };
  const setSearch = (next: Partial<SearchState>) =>
    navigate({ to: "/chronoblog", search: (prev: SearchState) => ({ ...prev, ...next }) });

  const query = q.trim().toLowerCase();
  const filtered = ARTICLES.filter((a) => {
    if (tag && !a.tags.includes(tag)) return false;
    if (!query) return true;
    return (
      a.title.toLowerCase().includes(query) ||
      a.excerpt.toLowerCase().includes(query) ||
      a.tags.some((t) => t.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.publishedAt.localeCompare(b.publishedAt);
      case "longest":
        return b.readMinutes - a.readMinutes;
      case "shortest":
        return a.readMinutes - b.readMinutes;
      case "newest":
      default:
        return b.publishedAt.localeCompare(a.publishedAt);
    }
  });

  const hasFilters = q !== "" || tag !== "" || sort !== "newest";

  return (
    <PublicShell>
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">ChronoBlog</h1>
          <p className="mt-4 text-muted-foreground">Productivity systems, tools, and thinking.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={q}
              onChange={(e) => setSearch({ q: e.target.value })}
              placeholder="Search articles, topics, tags..."
              className="pl-9 h-11 bg-card border-border"
            />
            {q && (
              <button
                onClick={() => setSearch({ q: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSearch({ sort: e.target.value as typeof sort })}
            className="h-11 px-3 rounded-md bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Sort articles"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="longest">Longest read</option>
            <option value="shortest">Shortest read</option>
          </select>
        </div>

        {/* Tag chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSearch({ tag: "" })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tag === ""
                ? "bg-brand text-brand-foreground border-brand"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-brand/50"
            }`}
          >
            All
          </button>
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setSearch({ tag: tag === t ? "" : t })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                tag === t
                  ? "bg-brand text-brand-foreground border-brand"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-brand/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Result meta */}
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            {tag && (
              <>
                {" "}
                tagged <span className="text-foreground">{tag}</span>
              </>
            )}
          </span>
          {hasFilters && (
            <button
              onClick={() => setSearch({ q: "", tag: "", sort: "newest" })}
              className="text-brand hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-foreground font-medium">No articles match your filters.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try a different search or tag.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((a) => (
              <Link
                key={a.slug}
                to="/chronoblog/$slug"
                params={{ slug: a.slug }}
                className="hover-tile p-6 block group"
              >
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-semibold tracking-tight group-hover:text-brand transition-colors">
                  {a.title}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {a.excerpt}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(a.publishedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {a.readMinutes} min
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-brand">
                    Read <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
