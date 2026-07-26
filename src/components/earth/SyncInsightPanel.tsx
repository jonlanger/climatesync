"use client";

import { ExternalLink, PanelRightClose, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SyncInsight } from "@/data/sync-insights";
import { cn } from "@/lib/utils";

type SyncInsightPanelProps = {
  insight: SyncInsight;
  focusSummary?: string | null;
  matchCount: number;
  epicenterCount: number;
  linkCount: number;
  onClose?: () => void;
};

export function SyncInsightPanel({
  insight,
  focusSummary,
  matchCount,
  epicenterCount,
  linkCount,
  onClose,
}: SyncInsightPanelProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-[24rem] flex-col border-l border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--panel-fg)]",
      )}
    >
      <div className="flex items-start gap-3 border-b border-[color:var(--panel-border)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
            Sync insight
          </p>
          <p className="font-heading text-2xl tracking-tight">{insight.title}</p>
          <p className="mt-1 text-sm text-[color:var(--panel-muted)]">{insight.summary}</p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
            onClick={onClose}
            aria-label="Close sync insight panel"
          >
            <PanelRightClose />
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-[color:var(--panel-border)] px-5 py-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-[color:var(--panel-hover)] px-2 py-2">
              <p className="text-lg tabular-nums text-[#f2c14e]">{matchCount}</p>
              <p className="text-[0.65rem] text-[color:var(--panel-muted)] uppercase">Cities</p>
            </div>
            <div className="rounded-md bg-[color:var(--panel-hover)] px-2 py-2">
              <p className="text-lg tabular-nums text-[#f2c14e]">{epicenterCount}</p>
              <p className="text-[0.65rem] text-[color:var(--panel-muted)] uppercase">Hubs</p>
            </div>
            <div className="rounded-md bg-[color:var(--panel-hover)] px-2 py-2">
              <p className="text-lg tabular-nums text-[#f2c14e]">{linkCount}</p>
              <p className="text-[0.65rem] text-[color:var(--panel-muted)] uppercase">Links</p>
            </div>
          </div>
          {focusSummary ? (
            <p className="mt-3 text-xs text-[color:var(--panel-muted)]">
              Clustering on <span className="text-[color:var(--panel-fg)]">{focusSummary}</span>
            </p>
          ) : null}
        </div>

        <figure className="border-b border-[color:var(--panel-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={insight.image.src}
            alt={insight.image.alt}
            className="h-44 w-full object-cover"
          />
          <figcaption className="px-5 py-2 text-[0.65rem] text-[color:var(--panel-muted)]">
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
        </figure>

        <div className="space-y-5 px-5 py-5">
          {insight.blurb.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-[color:var(--panel-fg)]/90">
              {paragraph}
            </p>
          ))}

          <section>
            <h3 className="mb-2 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
              Learn more
            </h3>
            <ul className="space-y-1.5">
              {insight.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#7dd3c0] hover:underline"
                  >
                    {link.label}
                    <ExternalLink className="size-3 opacity-70" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
              Citations
            </h3>
            <ul className="space-y-3">
              {insight.citations.map((citation) => (
                <li key={citation.href} className="text-sm">
                  <a
                    href={citation.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[color:var(--panel-fg)] hover:underline"
                  >
                    {citation.label}
                  </a>
                  {citation.detail ? (
                    <p className="mt-0.5 text-xs text-[color:var(--panel-muted)]">{citation.detail}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </aside>
  );
}

type CitySyncHoverCardProps = {
  cityName: string;
  country: string;
  score: number;
  reason?: string;
  isEpicenter?: boolean;
  x: number;
  y: number;
  onClose?: () => void;
};

export function CitySyncHoverCard({
  cityName,
  country,
  score,
  reason,
  isEpicenter = false,
  x,
  y,
  onClose,
}: CitySyncHoverCardProps) {
  return (
    <div
      className="pointer-events-none fixed z-30 w-56 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel)]/95 px-3 py-2.5 shadow-xl backdrop-blur-sm"
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[color:var(--panel-fg)]">{cityName}</p>
          <p className="truncate text-xs text-[color:var(--panel-muted)]">{country}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="pointer-events-auto text-[color:var(--panel-muted)]"
            onClick={onClose}
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="text-[color:var(--panel-muted)]">
          {isEpicenter ? "Cluster epicenter" : "Sync match"}
        </span>
        <span className="tabular-nums text-[#f2c14e]">{Math.round(score * 100)}%</span>
      </div>
      {reason ? (
        <p className="mt-1 line-clamp-2 text-[0.7rem] text-[color:var(--panel-muted)]">{reason}</p>
      ) : null}
      <p className="mt-2 text-[0.65rem] text-[color:var(--panel-muted)]/80">Click to open city panel</p>
    </div>
  );
}
