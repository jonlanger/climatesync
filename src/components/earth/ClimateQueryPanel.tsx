"use client";

import { useMemo, useState } from "react";
import { GitCompareArrows, Search, Sparkles, X } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  INSIGHT_SORT_OPTIONS,
  insightsByCategory,
  type InsightSortKey,
  type SyncInsight,
} from "@/data/sync-insights";
import type { ResolvedClimateQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

type InsightSortOption = (typeof INSIGHT_SORT_OPTIONS)[number];

type ClimateQueryPanelProps = {
  value: string;
  onValueChange: (value: string) => void;
  similarityEnabled: boolean;
  onSimilarityEnabledChange: (enabled: boolean) => void;
  resolved: ResolvedClimateQuery | null;
  onSelectMatch: (cityId: string) => void;
  activeInsightId?: string | null;
};

export function ClimateQueryPanel({
  value,
  onValueChange,
  similarityEnabled,
  onSimilarityEnabledChange,
  resolved,
  onSelectMatch,
  activeInsightId = null,
}: ClimateQueryPanelProps) {
  const [insightSort, setInsightSort] = useState<InsightSortKey>("category");
  const showCatalog = value.trim().length === 0;
  const clear = () => onValueChange("");
  const groups = useMemo(() => insightsByCategory(insightSort), [insightSort]);
  const selectedSort =
    INSIGHT_SORT_OPTIONS.find((option) => option.value === insightSort) ?? INSIGHT_SORT_OPTIONS[0];
  const insightCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.insights.length, 0),
    [groups],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-[color:var(--panel-border)] px-4 py-4">
        <InputGroup className="h-9">
          <InputGroupInput
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") clear();
            }}
            placeholder="Search floods, heat, volcano…"
            aria-label="Climate query"
          />
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
          {value ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear query"
                onClick={clear}
              >
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSimilarityEnabledChange(!similarityEnabled)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors",
              similarityEnabled
                ? "bg-[color:var(--panel-accent)] text-[color:var(--panel-fg)]"
                : "text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)]",
            )}
            aria-pressed={similarityEnabled}
          >
            <GitCompareArrows className="size-3.5" />
            Similarity {similarityEnabled ? "on" : "off"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {showCatalog ? (
          <div className="space-y-6">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
                <Sparkles className="size-3" />
                Sync insights
                <span className="text-[color:var(--panel-border)]">·</span>
                <span>{insightCount}</span>
              </p>
              <p className="mb-3 text-sm text-[color:var(--panel-muted)]">
                Choose a hazard or climate pattern to cluster and sync matching cities on the globe.
              </p>
              <Combobox
                items={[...INSIGHT_SORT_OPTIONS]}
                value={selectedSort}
                onValueChange={(option: InsightSortOption | null) => {
                  if (option) setInsightSort(option.value);
                }}
                itemToStringLabel={(option) => option?.label ?? ""}
                itemToStringValue={(option) => option?.value ?? ""}
                isItemEqualToValue={(item, value) => item?.value === value?.value}
                autoHighlight
              >
                <ComboboxInput
                  placeholder="Sort insights…"
                  aria-label="Sort sync insights"
                  className="w-full"
                />
                <ComboboxContent>
                  <ComboboxEmpty>No sort option found.</ComboboxEmpty>
                  <ComboboxList>
                    {(option) => (
                      <ComboboxItem key={option.value} value={option}>
                        {option.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {groups.map((group) => (
              <section key={group.category}>
                <h3 className="mb-2 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
                  {group.label}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {group.insights.map((insight) => (
                    <InsightButton
                      key={insight.id}
                      insight={insight}
                      active={activeInsightId === insight.id}
                      onSelect={() => onValueChange(insight.query)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {resolved ? (
          <div className={cn(showCatalog ? "mt-6" : "")}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-[color:var(--panel-fg)]">{resolved.summary}</p>
                <p className="mt-1 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
                  {resolved.mode.replace(/_/g, " ")}
                  {resolved.parsed.terms.length > 0
                    ? ` · ${resolved.parsed.terms.map((term) => term.label).join(", ")}`
                    : ""}
                  {!similarityEnabled ? " · similarity off" : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs text-[color:var(--panel-muted)]">
                {resolved.matches.length}
              </p>
            </div>

            {resolved.matches.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {resolved.matches.map((match) => (
                  <li key={match.cityId}>
                    <button
                      type="button"
                      onClick={() => onSelectMatch(match.cityId)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[color:var(--panel-hover)]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-[color:var(--panel-fg)]">
                          {match.city.name}
                        </span>
                        <span className="block truncate text-[0.7rem] text-[color:var(--panel-muted)]">
                          {match.reason}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-[#f2c14e]">
                        {Math.round(match.score * 100)}%
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[color:var(--panel-muted)]">No matching cities.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InsightButton({
  insight,
  active,
  onSelect,
}: {
  insight: SyncInsight;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-[#f2c14e]/45 bg-[color:var(--panel-hover)] text-[color:var(--panel-fg)]"
          : "border-[color:var(--panel-border)] text-[color:var(--panel-muted)] hover:border-[#f2c14e]/35 hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]",
      )}
    >
      <span className="block text-sm font-medium text-[color:var(--panel-fg)]">{insight.title}</span>
      <span className="mt-0.5 block text-[0.7rem] text-[color:var(--panel-muted)]">
        {insight.summary}
      </span>
    </button>
  );
}
