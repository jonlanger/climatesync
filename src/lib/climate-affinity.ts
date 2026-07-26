import type { City } from "@/data/cities";
import {
  type ClimateFact,
  type ClimateHazard,
  type ClimateProfile,
  type ClimateProfileFeatures,
  type ClimateRisk,
  type FeatureKey,
} from "@/lib/climate-profile";

export type QueryFocus =
  | { kind: "precip"; polarity: "wet" | "dry" }
  | { kind: "heat" }
  | { kind: "cold" }
  | { kind: "seasonality" }
  | { kind: "storm" }
  | { kind: "wildfire" }
  | { kind: "landslide" }
  | { kind: "hazard"; hazards: ClimateHazard[] }
  | { kind: "climate_zone"; facts: ClimateFact[] }
  | { kind: "full_climate" };

const PRECIP_FEATURES: FeatureKey[] = [
  "annualPrecipMm",
  "wettestMonthMm",
  "driestMonthMm",
  "precipSeasonality",
  "precipConcentration",
];

const HEAT_FEATURES: FeatureKey[] = ["hottestMonthMean", "annualMeanTemp"];
const COLD_FEATURES: FeatureKey[] = ["coldestMonthMean", "annualMeanTemp"];
const SEASON_FEATURES: FeatureKey[] = ["tempSeasonality", "hottestMonthMean", "coldestMonthMean"];
const STORM_FEATURES: FeatureKey[] = [
  "wettestMonthMm",
  "precipConcentration",
  "annualPrecipMm",
];
const WILDFIRE_FEATURES: FeatureKey[] = [
  "hottestMonthMean",
  "annualPrecipMm",
  "driestMonthMm",
];
const LANDSLIDE_FEATURES: FeatureKey[] = [
  "wettestMonthMm",
  "annualPrecipMm",
  "precipConcentration",
];

const FEATURE_SPREAD: Record<FeatureKey, number> = {
  annualMeanTemp: 20,
  annualPrecipMm: 1200,
  hottestMonthMean: 15,
  coldestMonthMean: 20,
  tempSeasonality: 20,
  wettestMonthMm: 200,
  driestMonthMm: 60,
  precipSeasonality: 0.35,
  precipConcentration: 0.25,
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function featureDistance(
  a: ClimateProfileFeatures,
  b: ClimateProfileFeatures,
  keys: readonly FeatureKey[],
): number {
  if (keys.length === 0) return 0;
  let sum = 0;
  for (const key of keys) {
    const spread = FEATURE_SPREAD[key];
    sum += Math.abs(a[key] - b[key]) / Math.max(spread, 1e-6);
  }
  return sum / keys.length;
}

function featureAffinity(
  a: ClimateProfileFeatures,
  b: ClimateProfileFeatures,
  keys: readonly FeatureKey[],
): number {
  // Distance 0 → affinity 1; distance ~1.5 spreads → affinity near 0.
  return clamp01(1 - featureDistance(a, b, keys) / 1.35);
}

function haversineKm(a: City, b: City): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function geographicAffinity(a: City, b: City, scaleKm = 2500): number {
  return clamp01(1 - haversineKm(a, b) / scaleKm);
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

/**
 * Infer what dimension(s) the query is really about so matching and linking
 * can weight rainfall with rainfall, seismic with seismic, etc.
 */
export function inferQueryFocus(traits: {
  risks?: ClimateRisk[];
  facts?: ClimateFact[];
  hazards?: ClimateHazard[];
}): QueryFocus {
  const risks = traits.risks ?? [];
  const facts = traits.facts ?? [];
  const hazards = traits.hazards ?? [];

  if (hazards.length > 0) {
    return { kind: "hazard", hazards: [...hazards] };
  }

  if (risks.includes("drought_stress") && !risks.includes("heavy_rainfall")) {
    return { kind: "precip", polarity: "dry" };
  }
  if (
    risks.includes("heavy_rainfall") ||
    risks.includes("monsoon_pattern") ||
    (risks.includes("drought_stress") && risks.includes("heavy_rainfall"))
  ) {
    return { kind: "precip", polarity: "wet" };
  }
  if (risks.includes("extreme_heat")) return { kind: "heat" };
  if (risks.includes("extreme_cold")) return { kind: "cold" };
  if (risks.includes("high_seasonality")) return { kind: "seasonality" };
  if (risks.includes("storm_risk")) return { kind: "storm" };
  if (risks.includes("wildfire_risk")) return { kind: "wildfire" };
  if (risks.includes("landslide_risk")) return { kind: "landslide" };
  if (facts.length > 0) return { kind: "climate_zone", facts: [...facts] };
  return { kind: "full_climate" };
}

/** How strongly a city exhibits the queried trait (0–1). */
export function traitStrength(profile: ClimateProfile, focus: QueryFocus): number {
  const f = profile.features;

  switch (focus.kind) {
    case "precip":
      if (focus.polarity === "dry") {
        const annual = clamp01(1 - f.annualPrecipMm / 900);
        const driest = clamp01(1 - f.driestMonthMm / 40);
        return clamp01(0.55 * annual + 0.45 * driest);
      }
      {
        const annual = clamp01(f.annualPrecipMm / 1800);
        const wettest = clamp01(f.wettestMonthMm / 300);
        const peak = clamp01(f.precipConcentration / 0.7);
        return clamp01(0.4 * annual + 0.4 * wettest + 0.2 * peak);
      }
    case "heat":
      return clamp01(
        0.6 * clamp01((f.hottestMonthMean - 28) / 12) +
          0.4 * clamp01((f.annualMeanTemp - 22) / 12),
      );
    case "cold":
      return clamp01(
        0.65 * clamp01((-5 - f.coldestMonthMean) / 25) +
          0.35 * clamp01((5 - f.annualMeanTemp) / 20),
      );
    case "seasonality":
      return clamp01((f.tempSeasonality - 15) / 25);
    case "storm":
      return clamp01(
        0.5 * clamp01(f.wettestMonthMm / 280) + 0.5 * clamp01(f.precipConcentration / 0.65),
      );
    case "wildfire":
      return clamp01(
        0.45 * clamp01((f.hottestMonthMean - 28) / 12) +
          0.35 * clamp01(1 - f.annualPrecipMm / 800) +
          0.2 * clamp01(1 - f.driestMonthMm / 25),
      );
    case "landslide":
      return clamp01(
        0.55 * clamp01(f.wettestMonthMm / 280) + 0.45 * clamp01(f.annualPrecipMm / 1600),
      );
    case "hazard": {
      const hits = focus.hazards.filter((h) => (profile.hazards ?? []).includes(h));
      return hits.length === 0 ? 0 : hits.length / focus.hazards.length;
    }
    case "climate_zone": {
      const hits = focus.facts.filter((fact) => profile.facts.includes(fact));
      return hits.length === 0 ? 0 : hits.length / focus.facts.length;
    }
    case "full_climate":
      return 0.5;
  }
}

/**
 * Pairwise affinity used for clustering/linking. Only compares the dimensions
 * that matter for the current query focus.
 */
export function affinityBetween(
  a: { profile: ClimateProfile; city: City },
  b: { profile: ClimateProfile; city: City },
  focus: QueryFocus,
): number {
  const { profile: pa, city: ca } = a;
  const { profile: pb, city: cb } = b;

  switch (focus.kind) {
    case "precip":
      return featureAffinity(
        pa.features,
        pb.features,
        focus.polarity === "dry"
          ? (["annualPrecipMm", "driestMonthMm", "precipSeasonality"] as FeatureKey[])
          : PRECIP_FEATURES,
      );
    case "heat":
      return featureAffinity(pa.features, pb.features, HEAT_FEATURES);
    case "cold":
      return featureAffinity(pa.features, pb.features, COLD_FEATURES);
    case "seasonality":
      return featureAffinity(pa.features, pb.features, SEASON_FEATURES);
    case "storm":
      return featureAffinity(pa.features, pb.features, STORM_FEATURES);
    case "wildfire":
      return featureAffinity(pa.features, pb.features, WILDFIRE_FEATURES);
    case "landslide":
      return featureAffinity(pa.features, pb.features, LANDSLIDE_FEATURES);
    case "hazard": {
      const shared = focus.hazards.filter(
        (h) => (pa.hazards ?? []).includes(h) && (pb.hazards ?? []).includes(h),
      );
      if (shared.length === 0) return 0;
      const hazardScore = shared.length / focus.hazards.length;
      // Regional basins (Anatolia, Japan, Andes…) — distant peers stay in other clusters.
      const geo = geographicAffinity(ca, cb, 2200);
      if (geo < 0.22) return clamp01(hazardScore * 0.2);
      return clamp01(0.35 * hazardScore + 0.65 * geo);
    }
    case "climate_zone": {
      const overlap = jaccard(
        pa.facts.filter((f) => focus.facts.includes(f)),
        pb.facts.filter((f) => focus.facts.includes(f)),
      );
      const climate = clamp01((cosineSimilarity(pa.vector, pb.vector) + 1) / 2);
      return clamp01(0.55 * overlap + 0.45 * climate);
    }
    case "full_climate": {
      const climate = clamp01((cosineSimilarity(pa.vector, pb.vector) + 1) / 2);
      const risks = jaccard(pa.risks, pb.risks);
      const facts = jaccard(pa.facts, pb.facts);
      return clamp01(0.7 * climate + 0.2 * risks + 0.1 * facts);
    }
  }
}

/** Minimum pairwise affinity required to draw a sync link. */
export function linkAffinityThreshold(focus: QueryFocus): number {
  switch (focus.kind) {
    case "hazard":
      return 0.48;
    case "precip":
    case "storm":
    case "landslide":
      return 0.7;
    case "heat":
    case "cold":
    case "wildfire":
    case "seasonality":
      return 0.55;
    case "climate_zone":
      return 0.52;
    case "full_climate":
      return 0.6;
  }
}

export function focusLabel(focus: QueryFocus): string {
  switch (focus.kind) {
    case "precip":
      return focus.polarity === "dry" ? "similar dryness" : "similar rainfall";
    case "heat":
      return "similar heat";
    case "cold":
      return "similar cold";
    case "seasonality":
      return "similar seasonality";
    case "storm":
      return "similar storm climate";
    case "wildfire":
      return "similar fire weather";
    case "landslide":
      return "similar landslide climate";
    case "hazard":
      return `shared ${focus.hazards.map((h) => h.replace(/_/g, " ")).join("/")}`;
    case "climate_zone":
      return "similar climate zone";
    case "full_climate":
      return "similar climate";
  }
}
