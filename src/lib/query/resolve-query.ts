import { CITIES, type City } from "@/data/cities";
import { CLIMATE_PROFILES } from "@/data/climate-profiles";
import {
  inferQueryFocus,
  traitStrength,
  affinityBetween,
  linkAffinityThreshold,
} from "@/lib/climate-affinity";
import {
  findCitiesByTraits,
  findSimilarCities,
  scoreClimateSimilarity,
  type CitySimilarity,
  type ClimateFact,
  type ClimateHazard,
  type ClimateProfile,
  type ClimateRisk,
} from "@/lib/climate-profile";
import { parseClimateQuery, type ParsedQuery } from "@/lib/query/parse-query";

export type QueryResultMode =
  | "city_lookup"
  | "similar_to"
  | "trait_search"
  | "compare"
  | "explain_city"
  | "empty"
  | "unresolved";

export type QueryMatch = {
  cityId: string;
  city: City;
  profile: ClimateProfile;
  score: number;
  sharedRisks: ClimateRisk[];
  sharedFacts: ClimateFact[];
  sharedHazards: ClimateHazard[];
  reason: string;
};

export type ResolvedClimateQuery = {
  parsed: ParsedQuery;
  mode: QueryResultMode;
  seedCityId: string | null;
  matches: QueryMatch[];
  summary: string;
};

const CITY_BY_ID = new Map(CITIES.map((city) => [city.id, city]));

function cityOrThrow(cityId: string): City {
  const city = CITY_BY_ID.get(cityId);
  if (!city) {
    throw new Error(`Unknown city id: ${cityId}`);
  }
  return city;
}

function profileOrNull(cityId: string): ClimateProfile | null {
  return CLIMATE_PROFILES[cityId] ?? null;
}

function formatList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function toMatchFromSimilarity(entry: CitySimilarity): QueryMatch | null {
  const city = CITY_BY_ID.get(entry.cityId);
  const profile = profileOrNull(entry.cityId);
  if (!city || !profile) return null;

  const bits = [
    ...entry.sharedRisks.map((risk) => risk.replace(/_/g, " ")),
    ...entry.sharedFacts.map((fact) => fact.replace(/_/g, " ")),
  ];

  return {
    cityId: entry.cityId,
    city,
    profile,
    score: entry.score,
    sharedRisks: entry.sharedRisks,
    sharedFacts: entry.sharedFacts,
    sharedHazards: [],
    reason:
      bits.length > 0
        ? `Similar climate · shared ${formatList(bits)}`
        : `Similar climate profile (${Math.round(entry.score * 100)}% match)`,
  };
}

function resolveSimilar(parsed: ParsedQuery): ResolvedClimateQuery {
  const seed = parsed.cities[0];
  const seedProfile = profileOrNull(seed.cityId);
  const seedCity = CITY_BY_ID.get(seed.cityId);
  if (!seedProfile || !seedCity) {
    return {
      parsed,
      mode: "unresolved",
      seedCityId: seed.cityId,
      matches: [],
      summary: `No climate profile found for ${seed.name}.`,
    };
  }

  const focus = inferQueryFocus({
    risks: parsed.risks,
    facts: parsed.facts,
    hazards: parsed.hazards,
  });

  let similarities = findSimilarCities(seed.cityId, CLIMATE_PROFILES, {
    minScore: 0.55,
    limit: 50,
  });

  // Optional trait filter: "cities like Tokyo with monsoon"
  if (parsed.risks.length > 0 || parsed.facts.length > 0 || parsed.hazards.length > 0) {
    similarities = similarities.filter((entry) => {
      const profile = CLIMATE_PROFILES[entry.cityId];
      if (!profile) return false;
      const riskOk =
        parsed.risks.length === 0 || parsed.risks.every((risk) => profile.risks.includes(risk));
      const factOk =
        parsed.facts.length === 0 || parsed.facts.every((fact) => profile.facts.includes(fact));
      const hazardOk =
        parsed.hazards.length === 0 ||
        parsed.hazards.every((hazard) => (profile.hazards ?? []).includes(hazard));
      return riskOk && factOk && hazardOk;
    });
  }

  // Keep peers that are actually close on the query focus dimensions.
  const affinityFloor = linkAffinityThreshold(focus) * 0.9;
  similarities = similarities.filter((entry) => {
    const profile = CLIMATE_PROFILES[entry.cityId];
    const city = CITY_BY_ID.get(entry.cityId);
    if (!profile || !city) return false;
    return (
      affinityBetween(
        { profile: seedProfile, city: seedCity },
        { profile, city },
        focus,
      ) >= affinityFloor
    );
  });

  const peerMatches = similarities
    .map(toMatchFromSimilarity)
    .filter((entry): entry is QueryMatch => entry !== null)
    .slice(0, 40);

  // Seed is always the epicenter for similar_to — include it in the match set.
  const seedMatch: QueryMatch = {
    cityId: seed.cityId,
    city: seedCity,
    profile: seedProfile,
    score: 1,
    sharedRisks: seedProfile.risks,
    sharedFacts: seedProfile.facts,
    sharedHazards: seedProfile.hazards ?? [],
    reason: "Similarity epicenter",
  };

  const matches = [seedMatch, ...peerMatches];

  const traitNote =
    parsed.terms.length > 0
      ? ` filtered by ${formatList(parsed.terms.map((term) => term.label))}`
      : "";

  return {
    parsed,
    mode: "similar_to",
    seedCityId: seed.cityId,
    matches,
    summary:
      peerMatches.length > 0
        ? `Found ${peerMatches.length} cities with climate similar to ${seed.name}${traitNote}.`
        : `No strong climate matches for ${seed.name}${traitNote}.`,
  };
}

function resolveTraits(parsed: ParsedQuery): ResolvedClimateQuery {
  const focus = inferQueryFocus({
    risks: parsed.risks,
    facts: parsed.facts,
    hazards: parsed.hazards,
  });

  const traitHits = findCitiesByTraits(
    CLIMATE_PROFILES,
    { risks: parsed.risks, facts: parsed.facts, hazards: parsed.hazards },
    {
      limit: 80,
      strengthFor: (profile) => traitStrength(profile, focus),
    },
  );

  // Drop weak continuous matches so rainfall/heat/etc. stay nuanced.
  const minStrength = focus.kind === "hazard" ? 0.35 : 0.28;
  const filteredHits = traitHits.filter((hit) => hit.score >= minStrength).slice(0, 48);

  const matches: QueryMatch[] = filteredHits
    .map((hit) => {
      const city = CITY_BY_ID.get(hit.cityId);
      const profile = profileOrNull(hit.cityId);
      if (!city || !profile) return null;
      const labels = [
        ...hit.matchedRisks.map((risk) => risk.replace(/_/g, " ")),
        ...hit.matchedFacts.map((fact) => fact.replace(/_/g, " ")),
        ...hit.matchedHazards.map((hazard) => hazard.replace(/_/g, " ")),
      ];
      return {
        cityId: hit.cityId,
        city,
        profile,
        score: hit.score,
        sharedRisks: hit.matchedRisks,
        sharedFacts: hit.matchedFacts,
        sharedHazards: hit.matchedHazards,
        reason: `Matches ${formatList(labels)}`,
      } satisfies QueryMatch;
    })
    .filter((entry): entry is QueryMatch => entry !== null);

  const labels = parsed.terms.map((term) => term.label);
  const epicenter = matches[0];

  return {
    parsed,
    mode: "trait_search",
    // Strongest exemplar becomes the default epicenter for this trait cohort.
    seedCityId: epicenter?.cityId ?? null,
    matches,
    summary:
      matches.length > 0
        ? `Found ${matches.length} cities matching ${formatList(labels)}.`
        : `No cities matched ${formatList(labels) || "those climate terms"}.`,
  };
}

function resolveCompare(parsed: ParsedQuery): ResolvedClimateQuery {
  const cityIds = parsed.cities.map((city) => city.cityId);
  const profiles = cityIds
    .map((cityId) => profileOrNull(cityId))
    .filter((profile): profile is ClimateProfile => profile !== null);

  if (profiles.length < 2) {
    return {
      parsed,
      mode: "unresolved",
      seedCityId: cityIds[0] ?? null,
      matches: [],
      summary: "Need at least two cities with climate profiles to compare.",
    };
  }

  const seed = profiles[0];
  const matches: QueryMatch[] = profiles.slice(1).map((profile) => {
    const similarity = scoreClimateSimilarity(seed, profile);
    const city = cityOrThrow(profile.cityId);
    const bits = [
      ...similarity.sharedRisks.map((risk) => risk.replace(/_/g, " ")),
      ...similarity.sharedFacts.map((fact) => fact.replace(/_/g, " ")),
    ];
    return {
      cityId: profile.cityId,
      city,
      profile,
      score: similarity.score,
      sharedRisks: similarity.sharedRisks,
      sharedFacts: similarity.sharedFacts,
      sharedHazards: [],
      reason:
        bits.length > 0
          ? `${Math.round(similarity.score * 100)}% similar to ${cityOrThrow(seed.cityId).name} · shared ${formatList(bits)}`
          : `${Math.round(similarity.score * 100)}% similar to ${cityOrThrow(seed.cityId).name}`,
    };
  });

  // Include the seed as a match too so UI can highlight both sides.
  const seedCity = cityOrThrow(seed.cityId);
  matches.unshift({
    cityId: seed.cityId,
    city: seedCity,
    profile: seed,
    score: 1,
    sharedRisks: seed.risks,
    sharedFacts: seed.facts,
    sharedHazards: seed.hazards ?? [],
    reason: "Comparison baseline",
  });

  const names = parsed.cities.map((city) => city.name);
  return {
    parsed,
    mode: "compare",
    seedCityId: seed.cityId,
    matches,
    summary: `Comparing climate profiles for ${formatList(names)}.`,
  };
}

function resolveExplainOrLookup(
  parsed: ParsedQuery,
  mode: "explain_city" | "city_lookup",
): ResolvedClimateQuery {
  const matches: QueryMatch[] = parsed.cities
    .map((matched) => {
      const city = CITY_BY_ID.get(matched.cityId);
      const profile = profileOrNull(matched.cityId);
      if (!city || !profile) return null;
      const labels = [
        ...profile.risks.map((risk) => risk.replace(/_/g, " ")),
        ...profile.facts.map((fact) => fact.replace(/_/g, " ")),
        ...(profile.hazards ?? []).map((hazard) => hazard.replace(/_/g, " ")),
      ];
      return {
        cityId: city.id,
        city,
        profile,
        score: matched.confidence,
        sharedRisks: profile.risks,
        sharedFacts: profile.facts,
        sharedHazards: profile.hazards ?? [],
        reason: labels.length > 0 ? labels.join(" · ") : "Climate profile available",
      } satisfies QueryMatch;
    })
    .filter((entry): entry is QueryMatch => entry !== null);

  const primary = matches[0];
  return {
    parsed,
    mode,
    seedCityId: primary?.cityId ?? null,
    matches,
    summary: primary
      ? mode === "explain_city"
        ? `${primary.city.name}: ${primary.reason}.`
        : `Selected ${primary.city.name}.`
      : "City not found in the climate dataset.",
  };
}

/**
 * Parse + resolve a climate query into ranked city matches.
 * This is the stage-2 API later stages will call from the query bar.
 */
export function resolveClimateQuery(raw: string): ResolvedClimateQuery {
  const parsed = parseClimateQuery(raw);

  if (!parsed.normalized) {
    return {
      parsed,
      mode: "empty",
      seedCityId: null,
      matches: [],
      summary: "Enter a city, climate term, or question.",
    };
  }

  switch (parsed.intent) {
    case "similar_to":
      if (parsed.cities.length === 0) break;
      return resolveSimilar(parsed);
    case "trait_search":
      if (parsed.risks.length === 0 && parsed.facts.length === 0 && parsed.hazards.length === 0) {
        break;
      }
      return resolveTraits(parsed);
    case "compare":
      if (parsed.cities.length < 2) break;
      return resolveCompare(parsed);
    case "explain_city":
      if (parsed.cities.length === 0) break;
      return resolveExplainOrLookup(parsed, "explain_city");
    case "city_lookup":
      if (parsed.cities.length === 0) break;
      return resolveExplainOrLookup(parsed, "city_lookup");
    default:
      break;
  }

  // Soft fallbacks when intent confidence is weak but entities exist.
  if (
    parsed.cities.length >= 1 &&
    (parsed.risks.length > 0 || parsed.facts.length > 0 || parsed.hazards.length > 0)
  ) {
    return resolveSimilar({ ...parsed, intent: "similar_to" });
  }
  if (parsed.risks.length > 0 || parsed.facts.length > 0 || parsed.hazards.length > 0) {
    return resolveTraits({ ...parsed, intent: "trait_search" });
  }
  if (parsed.cities.length >= 2) {
    return resolveCompare({ ...parsed, intent: "compare" });
  }
  if (parsed.cities.length === 1) {
    return resolveExplainOrLookup({ ...parsed, intent: "city_lookup" }, "city_lookup");
  }

  return {
    parsed,
    mode: "unresolved",
    seedCityId: null,
    matches: [],
    summary:
      "Couldn’t understand that query. Try a city name, a hazard like “flood” or “earthquake”, or “cities like Tokyo”.",
  };
}
