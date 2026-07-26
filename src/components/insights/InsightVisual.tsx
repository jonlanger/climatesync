import type { SyncInsight } from "@/data/sync-insights";
import { getInsightIcon } from "@/data/sync-insight-icons";
import { cn } from "@/lib/utils";

type InsightVisualProps = {
  insight: SyncInsight;
  className?: string;
  /** Taller hero treatment for detail pages. */
  size?: "card" | "hero" | "panel";
};

export function InsightVisual({ insight, className, size = "card" }: InsightVisualProps) {
  const aspect =
    size === "hero" ? "aspect-[16/9]" : size === "panel" ? "h-44 w-full" : "aspect-[16/10]";

  if (insight.image) {
    return (
      <figure data-slot="insight-visual" className={cn("overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={insight.image.src}
          alt={insight.image.alt}
          className={cn(aspect, "w-full object-cover")}
        />
        {size !== "card" ? (
          <figcaption className="bg-[color:var(--panel-hover)] px-4 py-2 text-[0.65rem] text-[color:var(--panel-muted)]">
            Photo:{" "}
            <a
              href={insight.image.creditHref}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:text-[color:var(--panel-fg)] hover:underline"
            >
              {insight.image.credit}
            </a>
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const Icon = getInsightIcon(insight.icon);
  return (
    <div
      data-slot="insight-visual"
      className={cn(
        aspect,
        "flex w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,#1a3d4a_0%,#0f1c24_70%)]",
        className,
      )}
      role="img"
      aria-label={insight.title}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[color:var(--panel-accent)] text-[#f2c14e] ring-1 ring-[color:var(--panel-border)] sm:size-20">
        <Icon className={size === "hero" ? "size-10" : "size-8"} strokeWidth={1.5} />
      </div>
    </div>
  );
}
