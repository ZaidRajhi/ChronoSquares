import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicShell } from "@/components/public/PublicShell";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { ARTICLES_BY_SLUG } from "@/lib/chronoblog-articles";

export const Route = createFileRoute("/chronoblog/$slug")({
  loader: ({ params }) => {
    const article = ARTICLES_BY_SLUG[params.slug];
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Article — ChronoBlog" }] };
    return {
      meta: [
        { title: `${loaderData.article.title} — ChronoBlog` },
        { name: "description", content: loaderData.article.excerpt },
        { property: "og:title", content: loaderData.article.title },
        { property: "og:description", content: loaderData.article.excerpt },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <Link
          to="/chronoblog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft size={14} /> Back to ChronoBlog
        </Link>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {article.tags.map((t: string) => (
            <Link
              key={t}
              to="/chronoblog"
              search={{ tag: t, q: "", sort: "newest" as const }}
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
          {article.title}
        </h1>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(article.publishedAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {article.readMinutes} min read
          </span>
        </div>

        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{article.excerpt}</p>
        <div className="glow-divider my-10" />
        <div className="space-y-6 text-base text-foreground/85 leading-relaxed">
          {article.body.map((para: string, i: number) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </article>
    </PublicShell>
  );
}
