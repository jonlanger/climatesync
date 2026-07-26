import { CITIES, type City } from "@/data/cities";
import type { ClimateFact, ClimateHazard, ClimateRisk } from "@/lib/climate-profile";
import {
  CLIMATE_VOCABULARY,
  QUESTION_PATTERNS,
  SHORT_ALIAS_ALLOWLIST,
  STOP_PHRASES,
  type VocabularyEntry,
} from "@/lib/query/vocabulary";

export type QueryIntentType =
  | "city_lookup"
  | "similar_to"
  | "trait_search"
  | "compare"
  | "explain_city"
  | "unknown";

export type MatchedCity = {
  cityId: string;
  name: string;
  country: string;
  /** 0–1 confidence from string match quality. */
  confidence: number;
  matchedText: string;
};

export type MatchedTerm = {
  id: ClimateRisk | ClimateFact | ClimateHazard;
  kind: "risk" | "fact" | "hazard";
  label: string;
  matchedText: string;
  confidence: number;
};

export type ParsedQuery = {
  raw: string;
  normalized: string;
  intent: QueryIntentType;
  cities: MatchedCity[];
  risks: ClimateRisk[];
  facts: ClimateFact[];
  hazards: ClimateHazard[];
  terms: MatchedTerm[];
  /** Leftover tokens the parser did not map. */
  unmatched: string[];
  confidence: number;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type CityIndexEntry = {
  city: City;
  haystack: string;
  tokens: string[];
};

const CITY_INDEX: CityIndexEntry[] = CITIES.map((city) => {
  const haystack = normalizeText(`${city.name} ${city.country} ${city.id.replace(/-/g, " ")}`);
  return {
    city,
    haystack,
    tokens: haystack.split(" ").filter(Boolean),
  };
}).sort((a, b) => b.haystack.length - a.haystack.length);

const VOCAB_BY_ALIAS: Array<{ alias: string; entry: VocabularyEntry }> = CLIMATE_VOCABULARY.flatMap(
  (entry) =>
    [...new Set([entry.label, ...entry.aliases].map(normalizeText))]
      .filter(Boolean)
      .map((alias) => ({ alias, entry })),
).sort((a, b) => b.alias.length - a.alias.length);

function detectIntent(normalized: string): QueryIntentType {
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.pattern.test(normalized)) {
      return pattern.intent;
    }
  }

  return "unknown";
}

function stripStopPhrases(normalized: string): string {
  let text = ` ${normalized} `;
  const phrases = [...STOP_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    const needle = ` ${normalizeText(phrase)} `;
    text = text.split(needle).join(" ");
  }
  return text.replace(/\s+/g, " ").trim();
}

function scoreCityMatch(querySlice: string, entry: CityIndexEntry): number {
  if (querySlice === entry.haystack) return 1;
  if (querySlice === normalizeText(entry.city.name)) return 0.98;
  if (querySlice === normalizeText(entry.city.id.replace(/-/g, " "))) return 0.95;
  if (entry.haystack.startsWith(querySlice) && querySlice.length >= 3) {
    return 0.8 + Math.min(0.15, querySlice.length / 40);
  }
  // Token coverage for multi-word cities ("new york", "ho chi minh").
  const queryTokens = querySlice.split(" ").filter(Boolean);
  if (queryTokens.length === 0) return 0;
  const hit = queryTokens.filter((token) => entry.tokens.includes(token)).length;
  if (hit === queryTokens.length && queryTokens.length >= 2) return 0.9;
  if (hit === queryTokens.length && entry.tokens[0] === queryTokens[0]) return 0.75;
  return 0;
}

function findCitiesInText(text: string): { matches: MatchedCity[]; remainder: string } {
  let remainder = ` ${text} `;
  const matches: MatchedCity[] = [];
  const usedIds = new Set<string>();

  // Repeatedly take the leftmost, then longest, city mention.
  while (true) {
    let best:
      | {
          index: number;
          length: number;
          entry: CityIndexEntry;
          variant: string;
          confidence: number;
        }
      | null = null;

    for (const entry of CITY_INDEX) {
      if (usedIds.has(entry.city.id)) continue;
      const variants = [
        normalizeText(entry.city.name),
        normalizeText(`${entry.city.name} ${entry.city.country}`),
        normalizeText(entry.city.id.replace(/-/g, " ")),
      ];

      for (const variant of variants) {
        if (variant.length < 3) continue;
        const needle = ` ${variant} `;
        const index = remainder.indexOf(needle);
        if (index === -1) continue;
        const confidence = scoreCityMatch(variant, entry);
        if (confidence < 0.7) continue;

        if (
          !best ||
          index < best.index ||
          (index === best.index && variant.length > best.length)
        ) {
          best = {
            index,
            length: needle.length,
            entry,
            variant,
            confidence,
          };
        }
      }
    }

    if (!best) break;

    usedIds.add(best.entry.city.id);
    matches.push({
      cityId: best.entry.city.id,
      name: best.entry.city.name,
      country: best.entry.city.country,
      confidence: best.confidence,
      matchedText: best.variant,
    });
    remainder = `${remainder.slice(0, best.index)} ${remainder.slice(best.index + best.length - 1)}`;
  }

  return {
    matches,
    remainder: remainder.replace(/\s+/g, " ").trim(),
  };
}

function findTermsInText(text: string): { matches: MatchedTerm[]; remainder: string } {
  let remainder = ` ${text} `;
  const matches: MatchedTerm[] = [];
  const used = new Set<string>();

  for (const { alias, entry } of VOCAB_BY_ALIAS) {
    if (alias.length < 3 && !SHORT_ALIAS_ALLOWLIST.has(alias)) continue;
    const needle = ` ${alias} `;
    const index = remainder.indexOf(needle);
    if (index === -1) continue;
    if (used.has(entry.id)) {
      remainder = `${remainder.slice(0, index)} ${remainder.slice(index + needle.length - 1)}`;
      continue;
    }

    used.add(entry.id);
    matches.push({
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
      matchedText: alias,
      confidence: alias === normalizeText(entry.label) ? 1 : 0.9,
    });
    remainder = `${remainder.slice(0, index)} ${remainder.slice(index + needle.length - 1)}`;
  }

  return {
    matches,
    remainder: remainder.replace(/\s+/g, " ").trim(),
  };
}

function inferIntent(args: {
  detected: QueryIntentType;
  cities: MatchedCity[];
  terms: MatchedTerm[];
  rawNormalized: string;
}): QueryIntentType {
  const { detected, cities, terms, rawNormalized } = args;

  if (detected !== "unknown") {
    if (detected === "similar_to" && cities.length >= 1) return "similar_to";
    if (detected === "compare" && cities.length >= 2) return "compare";
    if (detected === "explain_city" && cities.length >= 1) return "explain_city";
    if (detected === "trait_search" && terms.length >= 1) return "trait_search";
    if (detected === "compare" && cities.length === 1) return "explain_city";
  }

  if (cities.length >= 2 && /\b(vs|versus|compare|and)\b/.test(rawNormalized)) {
    return "compare";
  }
  if (cities.length >= 1 && /\b(like|similar)\b/.test(rawNormalized)) {
    return "similar_to";
  }
  if (cities.length === 1 && terms.length === 0) {
    return "city_lookup";
  }
  if (terms.length >= 1 && cities.length === 0) {
    return "trait_search";
  }
  if (cities.length >= 1 && terms.length >= 1) {
    return "similar_to";
  }
  if (cities.length >= 2) {
    return "compare";
  }

  return "unknown";
}

function overallConfidence(parsed: Omit<ParsedQuery, "confidence">): number {
  if (parsed.intent === "unknown") return 0.1;
  const cityScore =
    parsed.cities.length === 0
      ? 0.5
      : parsed.cities.reduce((sum, city) => sum + city.confidence, 0) / parsed.cities.length;
  const termScore =
    parsed.terms.length === 0
      ? 0.5
      : parsed.terms.reduce((sum, term) => sum + term.confidence, 0) / parsed.terms.length;

  if (parsed.intent === "trait_search") return Math.min(1, 0.35 + termScore * 0.65);
  if (parsed.intent === "city_lookup" || parsed.intent === "explain_city") {
    return Math.min(1, 0.35 + cityScore * 0.65);
  }
  if (parsed.intent === "similar_to") {
    return Math.min(1, 0.25 + cityScore * 0.5 + (parsed.terms.length > 0 ? termScore * 0.25 : 0.2));
  }
  if (parsed.intent === "compare") {
    return Math.min(1, 0.2 + cityScore * 0.8);
  }
  return 0.4;
}

/**
 * Parse a free-text climate query into a structured intent.
 * Handles city names, climate vocabulary, and common question phrasings.
 */
export function parseClimateQuery(raw: string): ParsedQuery {
  const normalized = normalizeText(raw);
  if (!normalized) {
    return {
      raw,
      normalized: "",
      intent: "unknown",
      cities: [],
      risks: [],
      facts: [],
      hazards: [],
      terms: [],
      unmatched: [],
      confidence: 0,
    };
  }

  const detected = detectIntent(normalized);
  const working = stripStopPhrases(normalized);
  const { matches: cities, remainder: afterCities } = findCitiesInText(
    working.length > 0 ? working : normalized,
  );
  const { matches: terms, remainder: afterTerms } = findTermsInText(afterCities);

  const risks = terms.filter((term) => term.kind === "risk").map((term) => term.id as ClimateRisk);
  const facts = terms.filter((term) => term.kind === "fact").map((term) => term.id as ClimateFact);
  const hazards = terms
    .filter((term) => term.kind === "hazard")
    .map((term) => term.id as ClimateHazard);
  const unmatched = afterTerms
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

  const intent = inferIntent({ detected, cities, terms, rawNormalized: normalized });

  const parsed: Omit<ParsedQuery, "confidence"> = {
    raw,
    normalized,
    intent,
    cities,
    risks,
    facts,
    hazards,
    terms,
    unmatched,
  };

  return {
    ...parsed,
    confidence: overallConfidence(parsed),
  };
}
