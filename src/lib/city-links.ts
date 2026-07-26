import type { City } from "@/data/cities";
import type { CityLink } from "@/components/earth/CityLinks";
import {
  affinityBetween,
  focusLabel,
  inferQueryFocus,
  linkAffinityThreshold,
  type QueryFocus,
} from "@/lib/climate-affinity";
import type { ClimateProfile } from "@/lib/climate-profile";
import type { QueryResultMode } from "@/lib/query";

const MAX_LINKS = 36;
const MAX_CLUSTER_LINKS = 8;
const MAX_CLUSTERS = 6;

export type LinkMatch = {
  cityId: string;
  score: number;
  city: City;
  profile: ClimateProfile;
};

export type CityLinkBuildResult = {
  links: CityLink[];
  /** Cluster epicenters (hubs) used for the sync graph. */
  epicenterIds: string[];
  focus: QueryFocus;
  focusSummary: string;
};

type Cluster = {
  memberIds: string[];
  hubId: string;
};

function buildClusters(
  matches: LinkMatch[],
  focus: QueryFocus,
  preferredHubId: string | null,
): Cluster[] {
  const threshold = linkAffinityThreshold(focus);
  const byId = new Map(matches.map((match) => [match.cityId, match]));
  const ranked = [...matches].sort((a, b) => b.score - a.score);

  const affinity = (aId: string, bId: string) => {
    const left = byId.get(aId);
    const right = byId.get(bId);
    if (!left || !right) return 0;
    return affinityBetween(
      { profile: left.profile, city: left.city },
      { profile: right.profile, city: right.city },
      focus,
    );
  };

  // Mode-seeking hubs: a city is an epicenter if nothing stronger is already
  // "too similar" — preferred seed always becomes a hub when present.
  const hubIds: string[] = [];
  if (preferredHubId && byId.has(preferredHubId)) {
    hubIds.push(preferredHubId);
  }

  for (const candidate of ranked) {
    if (hubIds.includes(candidate.cityId)) continue;
    const dominated = hubIds.some((hubId) => affinity(candidate.cityId, hubId) >= threshold);
    if (!dominated) hubIds.push(candidate.cityId);
    if (hubIds.length >= MAX_CLUSTERS) break;
  }

  const assignments = new Map<string, string>();
  for (const match of matches) {
    let bestHub: string | null = null;
    let bestScore = -1;
    for (const hubId of hubIds) {
      const score =
        match.cityId === hubId ? Number.POSITIVE_INFINITY : affinity(match.cityId, hubId);
      if (score > bestScore) {
        bestScore = score;
        bestHub = hubId;
      }
    }
    if (!bestHub) continue;
    // Only join a hub's cluster when affinity is strong enough (except the hub itself).
    if (match.cityId !== bestHub && bestScore < threshold * 0.95) continue;
    assignments.set(match.cityId, bestHub);
  }

  const membersByHub = new Map<string, string[]>();
  for (const [cityId, hubId] of assignments) {
    const list = membersByHub.get(hubId) ?? [];
    list.push(cityId);
    membersByHub.set(hubId, list);
  }

  return hubIds
    .map((hubId) => {
      const memberIds = membersByHub.get(hubId) ?? [hubId];
      if (!memberIds.includes(hubId)) memberIds.unshift(hubId);
      return { memberIds, hubId };
    })
    .filter((cluster) => cluster.memberIds.length >= 2)
    .slice(0, MAX_CLUSTERS);
}

function linksForCluster(
  cluster: Cluster,
  matches: LinkMatch[],
  focus: QueryFocus,
): CityLink[] {
  const byId = new Map(matches.map((match) => [match.cityId, match]));
  const threshold = linkAffinityThreshold(focus);
  const hub = byId.get(cluster.hubId);
  if (!hub) return [];

  const peers = cluster.memberIds
    .filter((id) => id !== cluster.hubId)
    .map((id) => {
      const peer = byId.get(id)!;
      const affinity = affinityBetween(
        { profile: hub.profile, city: hub.city },
        { profile: peer.profile, city: peer.city },
        focus,
      );
      return { peer, affinity };
    })
    .filter((entry) => entry.affinity >= threshold * 0.92)
    .sort((a, b) => b.affinity - a.affinity || b.peer.score - a.peer.score)
    .slice(0, MAX_CLUSTER_LINKS);

  const links: CityLink[] = peers.map(({ peer, affinity }) => ({
    fromId: cluster.hubId,
    toId: peer.cityId,
    score: clamp01(0.45 * peer.score + 0.55 * affinity),
  }));

  // Within large clusters, also connect a few nearest neighbors so sync isn't only star-shaped.
  if (cluster.memberIds.length >= 4) {
    const members = cluster.memberIds
      .map((id) => byId.get(id)!)
      .sort((a, b) => b.score - a.score);
    for (let i = 0; i < members.length; i += 1) {
      let best: { toId: string; score: number } | null = null;
      for (let j = 0; j < members.length; j += 1) {
        if (i === j) continue;
        const affinity = affinityBetween(
          { profile: members[i].profile, city: members[i].city },
          { profile: members[j].profile, city: members[j].city },
          focus,
        );
        if (affinity < threshold) continue;
        if (!best || affinity > best.score) {
          best = { toId: members[j].cityId, score: affinity };
        }
      }
      if (!best) continue;
      if (best.toId === cluster.hubId || members[i].cityId === cluster.hubId) continue;
      const edgeKey = [members[i].cityId, best.toId].sort().join("::");
      if (links.some((link) => [link.fromId, link.toId].sort().join("::") === edgeKey)) {
        continue;
      }
      links.push({
        fromId: members[i].cityId,
        toId: best.toId,
        score: best.score * 0.75,
      });
      if (links.length >= MAX_CLUSTER_LINKS + 4) break;
    }
  }

  return links;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Build sync arcs from query-aware clusters.
 *
 * Epicenter rules:
 * - similar_to / compare: the seed city is the preferred epicenter of its cluster
 * - trait_search: each rainfall / seismic / etc. cluster picks its strongest exemplar
 *
 * Links only connect cities that are similar on the active focus dimensions
 * (e.g. rainfall↔rainfall, earthquake↔earthquake), not generic climate twins.
 */
export function buildCityLinks(input: {
  mode: QueryResultMode;
  seedCityId: string | null;
  selectedId: string | null;
  matches: LinkMatch[];
  risks?: import("@/lib/climate-profile").ClimateRisk[];
  facts?: import("@/lib/climate-profile").ClimateFact[];
  hazards?: import("@/lib/climate-profile").ClimateHazard[];
}): CityLinkBuildResult {
  const { mode, seedCityId, selectedId, matches } = input;

  const focus = inferQueryFocus({
    risks: input.risks,
    facts: input.facts,
    hazards: input.hazards,
  });
  const focusSummary = focusLabel(focus);

  if (matches.length < 2) {
    return { links: [], epicenterIds: [], focus, focusSummary };
  }

  let preferredHubId: string | null = null;
  if (seedCityId && matches.some((match) => match.cityId === seedCityId)) {
    preferredHubId = seedCityId;
  } else if (selectedId && matches.some((match) => match.cityId === selectedId)) {
    preferredHubId = selectedId;
  } else if (mode === "compare" || mode === "similar_to") {
    preferredHubId = matches[0]?.cityId ?? null;
  }

  const clusters = buildClusters(matches, focus, preferredHubId);

  // Fallback: if affinity threshold isolates everyone, keep a tight star around the preferred hub.
  if (clusters.length === 0) {
    const hubId =
      preferredHubId ??
      [...matches].sort((a, b) => b.score - a.score)[0]?.cityId ??
      null;
    if (!hubId) return { links: [], epicenterIds: [], focus, focusSummary };

    const hub = matches.find((match) => match.cityId === hubId)!;
    const links = matches
      .filter((match) => match.cityId !== hubId)
      .map((match) => ({
        match,
        affinity: affinityBetween(
          { profile: hub.profile, city: hub.city },
          { profile: match.profile, city: match.city },
          focus,
        ),
      }))
      .filter((entry) => entry.affinity >= linkAffinityThreshold(focus) * 0.85)
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, MAX_CLUSTER_LINKS)
      .map(({ match, affinity }) => ({
        fromId: hubId,
        toId: match.cityId,
        score: clamp01(0.45 * match.score + 0.55 * affinity),
      }));

    return {
      links,
      epicenterIds: links.length > 0 ? [hubId] : [],
      focus,
      focusSummary,
    };
  }

  const links: CityLink[] = [];
  const seen = new Set<string>();
  for (const cluster of clusters) {
    for (const link of linksForCluster(cluster, matches, focus)) {
      const key = [link.fromId, link.toId].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(link);
      if (links.length >= MAX_LINKS) break;
    }
    if (links.length >= MAX_LINKS) break;
  }

  return {
    links: links.sort((a, b) => b.score - a.score).slice(0, MAX_LINKS),
    epicenterIds: clusters.map((cluster) => cluster.hubId),
    focus,
    focusSummary,
  };
}
