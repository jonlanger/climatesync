"use client";

import { useEffect, useMemo, useState } from "react";

import { CITIES } from "@/data/cities";
import {
  insightForFocus,
  insightForQuery,
  type SyncInsight,
} from "@/data/sync-insights";
import { buildCityLinks } from "@/lib/city-links";
import {
  buildSizeRanks,
  filterCities,
  sortCities,
  type CitySortKey,
} from "@/lib/city-list";
import { resolveClimateQuery, type ResolvedClimateQuery } from "@/lib/query";
import { CityClimatePanel, type PanelMode } from "./CityClimatePanel";
import { EarthCanvas } from "./EarthCanvas";
import { LeftPanel, type LeftPanelTab } from "./LeftPanel";
import { CitySyncHoverCard, SyncInsightPanel } from "./SyncInsightPanel";

function gateSimilarity(
  resolved: ResolvedClimateQuery,
  similarityEnabled: boolean,
): ResolvedClimateQuery {
  if (similarityEnabled || resolved.mode !== "similar_to" || !resolved.seedCityId) {
    return resolved;
  }

  const seed = resolved.matches.find((match) => match.cityId === resolved.seedCityId);
  if (!seed) {
    return {
      ...resolved,
      mode: "city_lookup",
      matches: [],
      summary: "Similarity matching is turned off.",
    };
  }

  return {
    ...resolved,
    mode: "city_lookup",
    matches: [
      {
        ...seed,
        score: 1,
        reason: "Similarity matching is off — showing the selected city only",
      },
    ],
    summary: `Similarity is off. Showing ${seed.city.name} only.`,
  };
}

export function EarthExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [leftTab, setLeftTab] = useState<LeftPanelTab>("explore");
  const [query, setQuery] = useState(initialQuery);
  const [similarityEnabled, setSimilarityEnabled] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [citySort, setCitySort] = useState<CitySortKey>("population-desc");
  const [syncPanelOpen, setSyncPanelOpen] = useState(true);
  const [hover, setHover] = useState<{
    cityId: string;
    x: number;
    y: number;
  } | null>(null);

  const selectedCity = useMemo(
    () => CITIES.find((city) => city.id === selectedId) ?? null,
    [selectedId],
  );

  const sizeRanks = useMemo(
    () => buildSizeRanks(sortCities(CITIES, citySort)),
    [citySort],
  );

  const filteredIds = useMemo(() => {
    const trimmed = cityFilter.trim();
    if (!trimmed) return null;
    return new Set(filterCities(CITIES, trimmed).map((city) => city.id));
  }, [cityFilter]);

  const resolved = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    return gateSimilarity(resolveClimateQuery(trimmed), similarityEnabled);
  }, [query, similarityEnabled]);

  const matchedIds = useMemo(() => {
    if (!resolved || resolved.matches.length === 0) return null;
    return new Set(resolved.matches.map((match) => match.cityId));
  }, [resolved]);

  const matchScores = useMemo(() => {
    if (!resolved || resolved.matches.length === 0) return null;
    return new Map(resolved.matches.map((match) => [match.cityId, match.score]));
  }, [resolved]);

  const linkBuild = useMemo(() => {
    if (!resolved || resolved.matches.length < 2) return null;
    return buildCityLinks({
      mode: resolved.mode,
      seedCityId: resolved.seedCityId,
      selectedId,
      risks: resolved.parsed.risks,
      facts: resolved.parsed.facts,
      hazards: resolved.parsed.hazards,
      matches: resolved.matches.map((match) => ({
        cityId: match.cityId,
        score: match.score,
        city: match.city,
        profile: match.profile,
      })),
    });
  }, [resolved, selectedId]);

  const links = linkBuild?.links ?? [];
  const epicenterIds = useMemo(() => {
    if (linkBuild && linkBuild.epicenterIds.length > 0) {
      return new Set(linkBuild.epicenterIds);
    }
    if (resolved?.seedCityId) return new Set([resolved.seedCityId]);
    return null;
  }, [linkBuild, resolved?.seedCityId]);

  const queryActive = Boolean(query.trim()) && matchedIds !== null;

  const activeInsight: SyncInsight | null = useMemo(() => {
    if (!query.trim() || !resolved) return null;
    return (
      insightForFocus(linkBuild?.focus, {
        risks: resolved.parsed.risks,
        facts: resolved.parsed.facts,
        hazards: resolved.parsed.hazards,
      }) ?? insightForQuery(query)
    );
  }, [linkBuild?.focus, query, resolved]);

  const showSyncPanel = Boolean(queryActive && activeInsight && syncPanelOpen);

  useEffect(() => {
    if (queryActive && activeInsight) {
      setSyncPanelOpen(true);
    }
  }, [queryActive, activeInsight?.id]);

  useEffect(() => {
    if (!queryActive) setHover(null);
  }, [queryActive]);

  const hoveredMatch = useMemo(() => {
    if (!hover || !resolved) return null;
    return resolved.matches.find((match) => match.cityId === hover.cityId) ?? null;
  }, [hover, resolved]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPanelMode("open");
    setHover(null);
  };

  const handleHoverCity = (cityId: string | null, point?: { x: number; y: number }) => {
    if (!cityId || !point) {
      setHover(null);
      return;
    }
    setHover({ cityId, x: point.x, y: point.y });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    // Keep city panel as-is when activating sync; Sync panel becomes the primary right rail.
    if (!value.trim()) {
      setSyncPanelOpen(true);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#163a48_0%,#0a1620_45%,#060b10_100%)]">
      <LeftPanel
        tab={leftTab}
        onTabChange={setLeftTab}
        selectedId={selectedId}
        onSelect={handleSelect}
        matchedIds={matchedIds}
        queryActive={Boolean(query.trim())}
        query={query}
        onQueryChange={handleQueryChange}
        similarityEnabled={similarityEnabled}
        onSimilarityEnabledChange={setSimilarityEnabled}
        resolved={resolved}
        onSelectMatch={handleSelect}
        cityFilter={cityFilter}
        onCityFilterChange={setCityFilter}
        citySort={citySort}
        onCitySortChange={setCitySort}
        sizeRanks={sizeRanks}
        activeInsightId={activeInsight?.id ?? null}
      />
      <main className="relative min-w-0 flex-1">
        <EarthCanvas
          selectedId={selectedId}
          onSelect={handleSelect}
          matchedIds={matchedIds}
          matchScores={matchScores}
          seedCityId={resolved?.seedCityId ?? null}
          epicenterIds={epicenterIds}
          queryActive={queryActive}
          links={links}
          sizeRanks={sizeRanks}
          filteredIds={filteredIds}
          onHoverCity={queryActive ? handleHoverCity : undefined}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#060b10]/70 to-transparent" />

        {hover && hoveredMatch ? (
          <CitySyncHoverCard
            cityName={hoveredMatch.city.name}
            country={hoveredMatch.city.country}
            score={hoveredMatch.score}
            reason={hoveredMatch.reason}
            isEpicenter={epicenterIds?.has(hoveredMatch.cityId) ?? false}
            x={hover.x}
            y={hover.y}
          />
        ) : null}
      </main>

      <div className="flex h-full shrink-0">
        {showSyncPanel && activeInsight ? (
          <SyncInsightPanel
            insight={activeInsight}
            focusSummary={linkBuild?.focusSummary ?? null}
            matchCount={resolved?.matches.length ?? 0}
            epicenterCount={epicenterIds?.size ?? 0}
            linkCount={links.length}
            onClose={() => setSyncPanelOpen(false)}
          />
        ) : null}

        {queryActive && activeInsight && !syncPanelOpen ? (
          <aside className="flex h-full w-12 flex-col items-center border-l border-[color:var(--panel-border)] bg-[color:var(--panel)] py-3">
            <button
              type="button"
              onClick={() => setSyncPanelOpen(true)}
              className="flex flex-1 items-start justify-center overflow-hidden px-1"
              aria-label={`Open sync insight: ${activeInsight.title}`}
            >
              <span
                className="origin-center rotate-180 text-xs tracking-wide text-[#7dd3c0]"
                style={{ writingMode: "vertical-rl" }}
              >
                Sync · {activeInsight.title}
              </span>
            </button>
          </aside>
        ) : null}

        <CityClimatePanel city={selectedCity} mode={panelMode} onModeChange={setPanelMode} />
      </div>
    </div>
  );
}
