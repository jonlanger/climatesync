import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe2 } from "lucide-react";

import { InsightVisual } from "@/components/insights/InsightVisual";
import { Button } from "@/components/ui/button";
import {
  getSyncInsight,
  SYNC_INSIGHTS,
  SYNC_INSIGHT_CATEGORIES,
} from "@/data/sync-insights";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return SYNC_INSIGHTS.map((insight) => ({ id: insight.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const insight = getSyncInsight(id);
  if (!insight) return { title: "Insight · Climate Sync" };
  return {
    title: `${insight.title} · Climate Sync`,
    description: insight.summary,
  };
}

function categoryLabel(category: string) {
  return SYNC_INSIGHT_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
}

export default async function InsightDetailPage({ params }: PageProps) {
  const { id } = await params;
  const insight = getSyncInsight(id);
  if (!insight) notFound();

  const globeHref = `/?q=${encodeURIComponent(insight.query)}`;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/insights" />}
            className="text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
          >
            <ArrowLeft />
            All insights
          </Button>
          <Button
            size="sm"
            render={<Link href={globeHref} />}
            className="bg-[#7dd3c0]/15 text-[#7dd3c0] hover:bg-[#7dd3c0]/25"
          >
            <Globe2 />
            Open on globe
          </Button>
        </div>

        <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
          {categoryLabel(insight.category)} · Sync insight
        </p>
        <h1 className="font-heading mt-2 text-4xl tracking-tight text-[color:var(--panel-fg)] md:text-5xl">
          {insight.title}
        </h1>
        <p className="mt-3 text-lg text-[color:var(--panel-muted)]">{insight.summary}</p>

        <div className="mt-8 overflow-hidden rounded-xl ring-1 ring-[color:var(--panel-border)]">
          <InsightVisual insight={insight} size="hero" />
        </div>

        <div className="mt-8 space-y-5">
          {insight.blurb.split("\n\n").map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-base leading-relaxed text-[color:var(--panel-fg)]/90"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
            Learn more
          </h2>
          <ul className="space-y-2">
            {insight.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#7dd3c0] hover:underline"
                >
                  {link.label}
                  <ExternalLink className="size-3.5 opacity-70" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 border-t border-[color:var(--panel-border)] pt-8">
          <h2 className="mb-3 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
            Citations
          </h2>
          <ul className="space-y-4">
            {insight.citations.map((citation) => (
              <li key={citation.href}>
                <a
                  href={citation.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[color:var(--panel-fg)] hover:underline"
                >
                  {citation.label}
                </a>
                {citation.detail ? (
                  <p className="mt-0.5 text-sm text-[color:var(--panel-muted)]">{citation.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
