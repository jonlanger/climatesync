import type { MonthlyClimate } from "@/lib/climate";
import { hazardsForCity } from "@/data/city-hazards";

/** Discrete climate / hazard labels derived from profile metrics. */
export type ClimateRisk =
  | "extreme_heat"
  | "extreme_cold"
  | "heavy_rainfall"
  | "drought_stress"
  | "high_seasonality"
  | "monsoon_pattern"
  | "wildfire_risk"
  | "storm_risk"
  | "landslide_risk";

/** Compact factual climate descriptors for matching and search later. */
export type ClimateFact =
  | "tropical"
  | "subtropical"
  | "temperate"
  | "continental"
  | "polar"
  | "arid"
  | "semi_arid"
  | "humid"
  | "mediterranean"
  | "oceanic"
  | "warming_hotspot";

/** Static / overlay hazards that climate metrics alone cannot fully capture. */
export type ClimateHazard =
  | "earthquake"
  | "volcano"
  | "tsunami"
  | "dust_storm"
  | "storm_surge"
  | "coastal_erosion";

export type ClimateProfileFeatures = {
  /** Annual mean temperature (°C). */
  annualMeanTemp: number;
  /** Annual precipitation total (mm). */
  annualPrecipMm: number;
  /** Mean temperature of the hottest month (°C). */
  hottestMonthMean: number;
  /** Mean temperature of the coldest month (°C). */
  coldestMonthMean: number;
  /** Hottest − coldest monthly mean (°C). */
  tempSeasonality: number;
  /** Wettest month precipitation (mm). */
  wettestMonthMm: number;
  /** Driest month precipitation (mm). */
  driestMonthMm: number;
  /** (wettest − driest) / max(annualPrecip, 1). */
  precipSeasonality: number;
  /** Share of annual precip in the wettest 3 months (0–1). */
  precipConcentration: number;
};

export type ClimateProfile = {
  cityId: string;
  sourceYear: number;
  model: string;
  features: ClimateProfileFeatures;
  months: MonthlyClimate[];
  risks: ClimateRisk[];
  facts: ClimateFact[];
  hazards: ClimateHazard[];
  /** Unit vector used for cosine similarity (order = FEATURE_KEYS). */
  vector: number[];
};

export type SimilarityBreakdown = {
  climate: number;
  risks: number;
  facts: number;
};

export type CitySimilarity = {
  cityId: string;
  score: number;
  breakdown: SimilarityBreakdown;
  sharedRisks: ClimateRisk[];
  sharedFacts: ClimateFact[];
};

export type SimilarityOptions = {
  /** Minimum overall score to include (0–1). Default 0.55 */
  minScore?: number;
  /** Max results to return. Default 25 */
  limit?: number;
  /** Exclude the seed city. Default true */
  excludeSelf?: boolean;
  /** Weight for continuous climate features. Default 0.7 */
  climateWeight?: number;
  /** Weight for shared risk Jaccard. Default 0.2 */
  riskWeight?: number;
  /** Weight for shared fact Jaccard. Default 0.1 */
  factWeight?: number;
};

export const FEATURE_KEYS = [
  "annualMeanTemp",
  "annualPrecipMm",
  "hottestMonthMean",
  "coldestMonthMean",
  "tempSeasonality",
  "wettestMonthMm",
  "driestMonthMm",
  "precipSeasonality",
  "precipConcentration",
] as const satisfies readonly (keyof ClimateProfileFeatures)[];

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Rough normalization anchors so vectors are comparable across cities. */
const FEATURE_SCALE: Record<FeatureKey, { center: number; spread: number }> = {
  annualMeanTemp: { center: 15, spread: 20 },
  annualPrecipMm: { center: 900, spread: 1200 },
  hottestMonthMean: { center: 25, spread: 15 },
  coldestMonthMean: { center: 5, spread: 20 },
  tempSeasonality: { center: 15, spread: 20 },
  wettestMonthMm: { center: 150, spread: 200 },
  driestMonthMm: { center: 40, spread: 60 },
  precipSeasonality: { center: 0.35, spread: 0.35 },
  precipConcentration: { center: 0.45, spread: 0.25 },
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeFeature(key: FeatureKey, value: number): number {
  const { center, spread } = FEATURE_SCALE[key];
  // Map to roughly [-1, 1] then squash toward unit-ish range.
  return Math.tanh((value - center) / spread);
}

function jaccard<T extends string>(a: readonly T[], b: readonly T[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function sharedItems<T extends string>(a: readonly T[], b: readonly T[]): T[] {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function deriveFeatures(months: MonthlyClimate[]): ClimateProfileFeatures {
  const meanTemps = months.map((month) => month.meanTemp);
  const precips = months.map((month) => month.precipMm);
  const annualMeanTemp = mean(meanTemps);
  const annualPrecipMm = precips.reduce((sum, value) => sum + value, 0);
  const hottestMonthMean = Math.max(...meanTemps);
  const coldestMonthMean = Math.min(...meanTemps);
  const tempSeasonality = hottestMonthMean - coldestMonthMean;
  const wettestMonthMm = Math.max(...precips);
  const driestMonthMm = Math.min(...precips);
  const precipSeasonality =
    Math.max(annualPrecipMm, 1) > 0
      ? (wettestMonthMm - driestMonthMm) / Math.max(annualPrecipMm, 1)
      : 0;
  const wettestThree = [...precips].sort((a, b) => b - a).slice(0, 3);
  const precipConcentration =
    annualPrecipMm <= 0 ? 0 : wettestThree.reduce((sum, value) => sum + value, 0) / annualPrecipMm;

  return {
    annualMeanTemp,
    annualPrecipMm,
    hottestMonthMean,
    coldestMonthMean,
    tempSeasonality,
    wettestMonthMm,
    driestMonthMm,
    precipSeasonality,
    precipConcentration,
  };
}

export function deriveRisks(features: ClimateProfileFeatures): ClimateRisk[] {
  const risks: ClimateRisk[] = [];

  if (features.hottestMonthMean >= 32 || features.annualMeanTemp >= 28) {
    risks.push("extreme_heat");
  }
  if (features.coldestMonthMean <= -5 || features.annualMeanTemp <= 0) {
    risks.push("extreme_cold");
  }
  if (features.wettestMonthMm >= 250 || features.annualPrecipMm >= 1800) {
    risks.push("heavy_rainfall");
  }
  if (features.annualPrecipMm <= 400 || features.driestMonthMm <= 5) {
    risks.push("drought_stress");
  }
  if (features.tempSeasonality >= 25) {
    risks.push("high_seasonality");
  }
  if (features.precipConcentration >= 0.55 && features.annualPrecipMm >= 600) {
    risks.push("monsoon_pattern");
  }
  // Hot, dry summers → elevated wildfire / bushfire conditions.
  if (
    features.hottestMonthMean >= 30 &&
    features.annualPrecipMm <= 700 &&
    features.driestMonthMm <= 20
  ) {
    risks.push("wildfire_risk");
  }
  // Intense wet-season peaks → cyclone / severe-storm climate proxy.
  if (features.wettestMonthMm >= 200 && features.precipConcentration >= 0.48) {
    risks.push("storm_risk");
  }
  // Very wet / peaked rainfall → landslide / mudslide climate proxy.
  if (
    features.wettestMonthMm >= 250 ||
    (features.annualPrecipMm >= 1400 && features.precipConcentration >= 0.45)
  ) {
    risks.push("landslide_risk");
  }

  return risks;
}

export function deriveFacts(features: ClimateProfileFeatures): ClimateFact[] {
  const facts: ClimateFact[] = [];
  const { annualMeanTemp, coldestMonthMean, hottestMonthMean, annualPrecipMm, precipSeasonality } =
    features;

  if (coldestMonthMean >= 18) facts.push("tropical");
  else if (coldestMonthMean >= 5 && hottestMonthMean >= 22) facts.push("subtropical");
  else if (coldestMonthMean <= -10 || annualMeanTemp <= 2) facts.push("polar");
  else if (features.tempSeasonality >= 25) facts.push("continental");
  else facts.push("temperate");

  if (annualPrecipMm < 250) facts.push("arid");
  else if (annualPrecipMm < 500) facts.push("semi_arid");
  else if (annualPrecipMm >= 1200) facts.push("humid");

  // Dry summer / wet winter-ish signal (rough Mediterranean proxy).
  if (
    precipSeasonality >= 0.25 &&
    annualPrecipMm >= 300 &&
    annualPrecipMm <= 1000 &&
    hottestMonthMean >= 22 &&
    coldestMonthMean >= 0 &&
    coldestMonthMean <= 12
  ) {
    facts.push("mediterranean");
  }

  if (
    features.tempSeasonality <= 12 &&
    annualPrecipMm >= 600 &&
    coldestMonthMean >= 0 &&
    coldestMonthMean < 18
  ) {
    facts.push("oceanic");
  }

  if (hottestMonthMean >= 35) {
    facts.push("warming_hotspot");
  }

  return facts;
}

export function featuresToVector(features: ClimateProfileFeatures): number[] {
  const raw = FEATURE_KEYS.map((key) => normalizeFeature(key, features[key]));
  const magnitude = Math.sqrt(raw.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return raw;
  return raw.map((value) => value / magnitude);
}

export function buildClimateProfile(input: {
  cityId: string;
  months: MonthlyClimate[];
  sourceYear?: number;
  model?: string;
}): ClimateProfile {
  const features = deriveFeatures(input.months);
  return {
    cityId: input.cityId,
    sourceYear: input.sourceYear ?? 2020,
    model: input.model ?? "EC_Earth3P_HR",
    features,
    months: input.months,
    risks: deriveRisks(features),
    facts: deriveFacts(features),
    hazards: hazardsForCity(input.cityId),
    vector: featuresToVector(features),
  };
}

/**
 * Score how similar two climate profiles are.
 * Combines cosine similarity on climate features with Jaccard overlap of risks/facts.
 */
export function scoreClimateSimilarity(
  a: ClimateProfile,
  b: ClimateProfile,
  options: Pick<SimilarityOptions, "climateWeight" | "riskWeight" | "factWeight"> = {},
): CitySimilarity {
  const climateWeight = options.climateWeight ?? 0.7;
  const riskWeight = options.riskWeight ?? 0.2;
  const factWeight = options.factWeight ?? 0.1;
  const weightSum = climateWeight + riskWeight + factWeight;

  const climate = clamp01((cosineSimilarity(a.vector, b.vector) + 1) / 2);
  const risks = jaccard(a.risks, b.risks);
  const facts = jaccard(a.facts, b.facts);

  const score =
    (climate * climateWeight + risks * riskWeight + facts * factWeight) / Math.max(weightSum, 1e-6);

  return {
    cityId: b.cityId,
    score,
    breakdown: { climate, risks, facts },
    sharedRisks: sharedItems(a.risks, b.risks),
    sharedFacts: sharedItems(a.facts, b.facts),
  };
}

/**
 * Rank cities by climate / risk / fact similarity to a seed city.
 */
export function findSimilarCities(
  seedCityId: string,
  profiles: Record<string, ClimateProfile>,
  options: SimilarityOptions = {},
): CitySimilarity[] {
  const seed = profiles[seedCityId];
  if (!seed) return [];

  const {
    minScore = 0.55,
    limit = 25,
    excludeSelf = true,
    climateWeight,
    riskWeight,
    factWeight,
  } = options;

  const results: CitySimilarity[] = [];

  for (const profile of Object.values(profiles)) {
    if (excludeSelf && profile.cityId === seedCityId) continue;
    const similarity = scoreClimateSimilarity(seed, profile, {
      climateWeight,
      riskWeight,
      factWeight,
    });
    if (similarity.score >= minScore) {
      results.push(similarity);
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Find cities that share at least one of the requested risks, facts, or hazards.
 * Scores blend tag coverage with continuous trait strength for the query focus.
 */
export function findCitiesByTraits(
  profiles: Record<string, ClimateProfile>,
  traits: { risks?: ClimateRisk[]; facts?: ClimateFact[]; hazards?: ClimateHazard[] },
  options: {
    limit?: number;
    /** Optional continuous strength scorer (0–1) for ranking within tagged cities. */
    strengthFor?: (profile: ClimateProfile) => number;
  } = {},
): Array<{
  cityId: string;
  matchedRisks: ClimateRisk[];
  matchedFacts: ClimateFact[];
  matchedHazards: ClimateHazard[];
  score: number;
}> {
  const wantedRisks = new Set(traits.risks ?? []);
  const wantedFacts = new Set(traits.facts ?? []);
  const wantedHazards = new Set(traits.hazards ?? []);
  const limit = options.limit ?? 50;
  const possible = wantedRisks.size + wantedFacts.size + wantedHazards.size;

  const matches = Object.values(profiles)
    .map((profile) => {
      const matchedRisks = profile.risks.filter((risk) => wantedRisks.has(risk));
      const matchedFacts = profile.facts.filter((fact) => wantedFacts.has(fact));
      const matchedHazards = (profile.hazards ?? []).filter((hazard) =>
        wantedHazards.has(hazard),
      );
      const hitCount = matchedRisks.length + matchedFacts.length + matchedHazards.length;
      if (hitCount === 0) return null;
      const coverage = possible === 0 ? 0 : hitCount / possible;
      const strength = options.strengthFor?.(profile);
      const score =
        strength === undefined ? coverage : clamp01(0.35 * coverage + 0.65 * strength);
      return {
        cityId: profile.cityId,
        matchedRisks,
        matchedFacts,
        matchedHazards,
        score,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.score - a.score);

  return matches.slice(0, limit);
}
