"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";

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
  InputGroupInput,
} from "@/components/ui/input-group";
import { CITIES } from "@/data/cities";
import {
  CITY_SORT_OPTIONS,
  filterCities,
  markerTier,
  sortCities,
  type CitySortKey,
} from "@/lib/city-list";
import type { ResolvedClimateQuery } from "@/lib/query";
import { cn } from "@/lib/utils";
import { ClimateQueryPanel } from "./ClimateQueryPanel";

type CitySortOption = (typeof CITY_SORT_OPTIONS)[number];

export type LeftPanelTab = "explore" | "cities";

type LeftPanelProps = {
  tab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  matchedIds?: Set<string> | null;
  queryActive?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  similarityEnabled: boolean;
  onSimilarityEnabledChange: (enabled: boolean) => void;
  resolved: ResolvedClimateQuery | null;
  onSelectMatch: (cityId: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  citySort: CitySortKey;
  onCitySortChange: (value: CitySortKey) => void;
  sizeRanks: Map<string, number>;
  activeInsightId?: string | null;
};

function CitiesList({
  selectedId,
  onSelect,
  matchedIds = null,
  queryActive = false,
  cityFilter,
  onCityFilterChange,
  citySort,
  onCitySortChange,
  sizeRanks,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  matchedIds?: Set<string> | null;
  queryActive?: boolean;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  citySort: CitySortKey;
  onCitySortChange: (value: CitySortKey) => void;
  sizeRanks: Map<string, number>;
}) {
  const cities = useMemo(() => {
    const base =
      queryActive && matchedIds ? CITIES.filter((city) => matchedIds.has(city.id)) : CITIES;
    return sortCities(filterCities(base, cityFilter), citySort);
  }, [queryActive, matchedIds, cityFilter, citySort]);

  const selectedSort =
    CITY_SORT_OPTIONS.find((option) => option.value === citySort) ?? CITY_SORT_OPTIONS[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-[color:var(--panel-border)] px-4 py-3">
        <InputGroup className="h-8">
          <InputGroupInput
            value={cityFilter}
            onChange={(event) => onCityFilterChange(event.target.value)}
            placeholder="Filter cities…"
            aria-label="Filter cities"
          />
          <InputGroupAddon align="inline-start">
            <Search aria-hidden />
          </InputGroupAddon>
        </InputGroup>

        <Combobox
          items={[...CITY_SORT_OPTIONS]}
          value={selectedSort}
          onValueChange={(option: CitySortOption | null) => {
            if (option) onCitySortChange(option.value);
          }}
          itemToStringLabel={(option) => option?.label ?? ""}
          itemToStringValue={(option) => option?.value ?? ""}
          isItemEqualToValue={(item, value) => item?.value === value?.value}
          autoHighlight
        >
          <ComboboxInput
            placeholder="Sort cities…"
            aria-label="Sort cities"
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

        <p className="text-sm text-[color:var(--panel-muted)]">
          {queryActive
            ? `${cities.length} quer${cities.length === 1 ? "y match" : "y matches"}`
            : cityFilter.trim()
              ? `${cities.length} of ${CITIES.length} cities`
              : `${CITIES.length} cities · ${selectedSort.label}`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {cities.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-[color:var(--panel-muted)]">
            {queryActive ? "No cities match this climate query" : "No cities match this filter"}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {cities.map((city) => {
              const selected = selectedId === city.id;
              const matched = matchedIds?.has(city.id) ?? false;
              const sizeRank = sizeRanks.get(city.id) ?? city.rank;
              const tier = markerTier(sizeRank);

              return (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(city.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "bg-[color:var(--panel-accent)] text-[color:var(--panel-fg)]"
                        : matched
                          ? "bg-[color:var(--panel-hover)] hover:bg-[color:var(--panel-accent)]/40"
                          : "hover:bg-[color:var(--panel-hover)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium tabular-nums",
                        selected
                          ? "bg-[#f2c14e] text-[#1a1a14]"
                          : tier === "major"
                            ? "bg-[color:var(--panel-hover)] text-[color:var(--panel-muted)]"
                            : tier === "secondary"
                              ? "bg-transparent text-[color:var(--panel-muted)]/70"
                              : "bg-transparent text-[color:var(--panel-muted)]/45",
                      )}
                      title={`Marker size rank ${sizeRank}`}
                    >
                      {sizeRank}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{city.name}</span>
                      <span className="block truncate text-xs text-[color:var(--panel-muted)]">
                        {city.country}
                        <span className="text-[color:var(--panel-muted)]/60">
                          {" "}
                          · {(city.population / 1_000_000).toFixed(1)}M
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full",
                        tier === "major"
                          ? "size-2.5 bg-[#f0ebe3]/80"
                          : tier === "secondary"
                            ? "size-1.5 bg-[#9aa8b0]/80"
                            : "size-1 bg-[#6b7c86]/70",
                      )}
                      aria-hidden
                      title={`${tier} marker`}
                    />
                    {selected ? (
                      <span className="size-2 shrink-0 rounded-full bg-[#f2c14e]" aria-hidden />
                    ) : matched ? (
                      <span
                        className="size-2 shrink-0 rounded-full bg-[#f2c14e]/55"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function LeftPanel({
  tab,
  onTabChange,
  selectedId,
  onSelect,
  matchedIds = null,
  queryActive = false,
  query,
  onQueryChange,
  similarityEnabled,
  onSimilarityEnabledChange,
  resolved,
  onSelectMatch,
  cityFilter,
  onCityFilterChange,
  citySort,
  onCitySortChange,
  sizeRanks,
  activeInsightId = null,
}: LeftPanelProps) {
  return (
    <aside className="flex h-full w-full max-w-[26rem] flex-col border-r border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--panel-fg)]">
      <div className="border-b border-[color:var(--panel-border)] px-5 pt-5 pb-0">
        <p className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
          Climate Sync
        </p>
        <p className="mt-1 text-sm text-[color:var(--panel-muted)]">
          Explore climate links across major cities
        </p>

        <div
          className="mt-4 flex gap-1"
          role="tablist"
          aria-label="Left panel sections"
        >
          {(
            [
              { id: "explore", label: "Explore" },
              { id: "cities", label: "Cities" },
            ] as const
          ).map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "relative flex-1 rounded-t-md px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "text-[color:var(--panel-fg)]"
                    : "text-[color:var(--panel-muted)] hover:text-[color:var(--panel-fg)]",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors",
                    active ? "bg-[#f2c14e]" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {tab === "explore" ? (
        <ClimateQueryPanel
          value={query}
          onValueChange={onQueryChange}
          similarityEnabled={similarityEnabled}
          onSimilarityEnabledChange={onSimilarityEnabledChange}
          resolved={resolved}
          onSelectMatch={onSelectMatch}
          activeInsightId={activeInsightId}
        />
      ) : (
        <CitiesList
          selectedId={selectedId}
          onSelect={onSelect}
          matchedIds={matchedIds}
          queryActive={queryActive}
          cityFilter={cityFilter}
          onCityFilterChange={onCityFilterChange}
          citySort={citySort}
          onCitySortChange={onCitySortChange}
          sizeRanks={sizeRanks}
        />
      )}

      <div className="border-t border-[color:var(--panel-border)] px-5 py-3 text-xs text-[color:var(--panel-muted)]">
        Drag to rotate · click a city to focus
      </div>
    </aside>
  );
}
