import Link from "next/link";

import { InsightVisual } from "@/components/insights/InsightVisual";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  insightsByCategory,
  SYNC_INSIGHTS,
  SYNC_INSIGHT_CATEGORIES,
} from "@/data/sync-insights";

function categoryLabel(category: string) {
  return SYNC_INSIGHT_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
}

export const metadata = {
  title: "Sync Insights · Climate Sync",
  description: "Browse climate sync themes that connect peer cities across the globe.",
};

export default function InsightsPage() {
  const groups = insightsByCategory("category");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
        <header className="mb-10 max-w-2xl">
          <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
            Catalog
          </p>
          <h1 className="font-heading mt-1 text-4xl tracking-tight text-[color:var(--panel-fg)]">
            Sync Insights
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[color:var(--panel-muted)]">
            {SYNC_INSIGHTS.length} curated themes that group cities by shared climate
            fingerprints—rainfall, heat, storms, fire weather, coasts, and more. Open any
            card for the full story, then explore the pattern on the globe.
          </p>
        </header>

        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`cat-${group.category}`}>
              <h2
                id={`cat-${group.category}`}
                className="mb-4 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase"
              >
                {group.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.insights.map((insight) => (
                  <Link
                    key={insight.id}
                    href={`/insights/${insight.id}`}
                    className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#7dd3c0]/50"
                  >
                    <Card className="h-full border-0 bg-[color:var(--panel-hover)] pt-0 ring-1 ring-[color:var(--panel-border)] transition group-hover:ring-[#7dd3c0]/35">
                      <InsightVisual insight={insight} />
                      <CardHeader>
                        <p className="text-[0.65rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
                          {categoryLabel(insight.category)}
                        </p>
                        <CardTitle className="text-[color:var(--panel-fg)] group-hover:text-[#7dd3c0]">
                          {insight.title}
                        </CardTitle>
                        <CardDescription className="text-[color:var(--panel-muted)]">
                          {insight.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <span className="text-sm text-[#7dd3c0]">Read insight →</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
