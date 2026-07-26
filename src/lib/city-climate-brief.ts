import type { City } from "@/data/cities";
import { getClimateProfile } from "@/data/climate-profiles";
import type { CityClimateData } from "@/lib/climate";
import type {
  ClimateFact,
  ClimateHazard,
  ClimateProfile,
  ClimateRisk,
} from "@/lib/climate-profile";
import { CLIMATE_VOCABULARY } from "@/lib/query/vocabulary";

export type BriefTag = {
  id: string;
  label: string;
  kind: "risk" | "fact" | "hazard";
};

export type CityClimateBrief = {
  overview: string;
  weather: string;
  risksNarrative: string | null;
  outlook: string | null;
  facts: BriefTag[];
  risks: BriefTag[];
  hazards: BriefTag[];
};

const LABEL_BY_ID = new Map(CLIMATE_VOCABULARY.map((entry) => [entry.id, entry.label]));

function labelFor(id: string): string {
  return LABEL_BY_ID.get(id as ClimateRisk | ClimateFact | ClimateHazard) ?? id.replaceAll("_", " ");
}

function round1(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function round0(value: number): string {
  return String(Math.round(value));
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function climateZonePhrase(facts: ClimateFact[]): string {
  const zone =
    facts.find((fact) =>
      ["tropical", "subtropical", "temperate", "continental", "polar"].includes(fact),
    ) ?? null;
  const moisture =
    facts.find((fact) =>
      ["arid", "semi_arid", "humid", "mediterranean", "oceanic"].includes(fact),
    ) ?? null;

  const zoneLabel = zone ? labelFor(zone) : "mixed";
  if (!moisture) return `a ${zoneLabel} climate`;
  if (moisture === "mediterranean" || moisture === "oceanic") {
    return `a ${labelFor(moisture)} ${zoneLabel} climate`;
  }
  return `a ${labelFor(moisture)} ${zoneLabel} climate`;
}

function monthExtremes(profile: ClimateProfile): {
  hottest: string;
  coldest: string;
  wettest: string;
  driest: string;
} {
  const byMean = [...profile.months].sort((a, b) => b.meanTemp - a.meanTemp);
  const byPrecip = [...profile.months].sort((a, b) => b.precipMm - a.precipMm);
  return {
    hottest: byMean[0]?.label ?? "summer",
    coldest: byMean[byMean.length - 1]?.label ?? "winter",
    wettest: byPrecip[0]?.label ?? "the wet season",
    driest: byPrecip[byPrecip.length - 1]?.label ?? "the dry season",
  };
}

function buildOverview(city: City, profile: ClimateProfile): string {
  const { features, facts } = profile;
  const months = monthExtremes(profile);
  const hotspot = facts.includes("warming_hotspot")
    ? ` Peak summer means already reach about ${round1(features.hottestMonthMean)}°C, marking it as a warming hotspot in this dataset.`
    : "";

  return `${city.name} has ${climateZonePhrase(facts)}, with an annual mean near ${round1(features.annualMeanTemp)}°C and roughly ${round0(features.annualPrecipMm)} mm of precipitation a year. Temperatures typically range from about ${round1(features.coldestMonthMean)}°C in ${months.coldest} to ${round1(features.hottestMonthMean)}°C in ${months.hottest}.${hotspot}`;
}

function buildWeather(profile: ClimateProfile): string {
  const { features } = profile;
  const months = monthExtremes(profile);
  const seasonality =
    features.tempSeasonality >= 25
      ? `Strong seasonal swings (${round1(features.tempSeasonality)}°C between the warmest and coolest months) shape the year.`
      : features.tempSeasonality <= 8
        ? `Temperatures stay relatively steady year-round (only about ${round1(features.tempSeasonality)}°C between the warmest and coolest months).`
        : `Moderate seasonality (${round1(features.tempSeasonality)}°C between the warmest and coolest months) defines the annual cycle.`;

  const precip =
    features.precipConcentration >= 0.55
      ? `Rainfall is highly concentrated: the wettest stretch delivers most of the year’s water, with ${months.wettest} peaking near ${round0(features.wettestMonthMm)} mm while ${months.driest} can drop to about ${round0(features.driestMonthMm)} mm.`
      : features.annualPrecipMm <= 400
        ? `Precipitation is scarce overall, and the driest month averages only about ${round0(features.driestMonthMm)} mm.`
        : `Rainfall is more evenly spread than in monsoon climates, though ${months.wettest} is still the wettest month (~${round0(features.wettestMonthMm)} mm) and ${months.driest} the driest (~${round0(features.driestMonthMm)} mm).`;

  return `${seasonality} ${precip}`;
}

const RISK_DETAIL: Record<ClimateRisk, (f: ClimateProfile["features"]) => string> = {
  extreme_heat: (f) =>
    `Hot-month means near ${round1(f.hottestMonthMean)}°C raise heat-stress and cooling demand.`,
  extreme_cold: (f) =>
    `Cold-month means near ${round1(f.coldestMonthMean)}°C bring freeze risk and winter energy stress.`,
  heavy_rainfall: (f) =>
    `Wet-month totals around ${round0(f.wettestMonthMm)} mm increase flood and drainage pressure.`,
  drought_stress: (f) =>
    `Low annual rainfall (~${round0(f.annualPrecipMm)} mm) or near-dry months heighten water stress.`,
  high_seasonality: (f) =>
    `A ${round1(f.tempSeasonality)}°C seasonal swing requires infrastructure built for both heat and cold.`,
  monsoon_pattern: (f) =>
    `About ${Math.round(f.precipConcentration * 100)}% of annual rain falls in the wettest three months.`,
  wildfire_risk: (f) =>
    `Hot, dry stretches (hottest month ~${round1(f.hottestMonthMean)}°C, driest ~${round0(f.driestMonthMm)} mm) favor fire weather.`,
  storm_risk: (f) =>
    `Intense wet-season peaks (~${round0(f.wettestMonthMm)} mm in the wettest month) align with severe-storm climates.`,
  landslide_risk: (f) =>
    `Heavy, concentrated rainfall raises landslide and slope-failure potential on steep terrain.`,
};

const HAZARD_DETAIL: Record<ClimateHazard, string> = {
  earthquake: "Located in or near an active seismic zone.",
  volcano: "Within range of volcanic hazard from regional volcanoes.",
  tsunami: "Coastal exposure to tsunami risk from nearby seismic sources.",
  dust_storm: "Arid surrounds and wind regimes favor dust-storm events.",
  storm_surge: "Coastal lowlands can be inundated by storm-driven surge.",
  coastal_erosion: "Shoreline and coastal infrastructure face erosion pressure.",
};

function buildRisksNarrative(profile: ClimateProfile): string | null {
  if (profile.risks.length === 0 && profile.hazards.length === 0) {
    return "No elevated climate-risk flags stand out in the derived profile, though local topography and urban form can still create hotspots not captured here.";
  }

  const riskBits = profile.risks.map((risk) => labelFor(risk));
  const hazardBits = profile.hazards.map((hazard) => labelFor(hazard));

  const riskSentence =
    riskBits.length > 0
      ? `Derived climate signals highlight ${joinList(riskBits)}.`
      : null;
  const hazardSentence =
    hazardBits.length > 0
      ? `Static geographic overlays also flag ${joinList(hazardBits)}.`
      : null;

  return [riskSentence, hazardSentence].filter(Boolean).join(" ");
}

function buildOutlook(data: CityClimateData | null | undefined): string | null {
  if (!data) return null;
  const tempDelta = data.future.annualMeanTemp - data.recent.annualMeanTemp;
  const precipDelta = data.future.annualPrecipMm - data.recent.annualPrecipMm;
  const tempWord = tempDelta >= 0 ? "warmer" : "cooler";
  const precipWord = precipDelta >= 0 ? "wetter" : "drier";

  return `CMIP6 projections for this location point to a ${tempWord} climate by 2040 (${tempDelta >= 0 ? "+" : "−"}${Math.abs(tempDelta).toFixed(1)}°C annual mean) and a ${precipWord} year overall (${precipDelta >= 0 ? "+" : "−"}${Math.abs(Math.round(precipDelta))} mm). These are model-based city-point estimates, not local policy forecasts.`;
}

/**
 * Build a readable climate brief for a city from its precomputed profile
 * (and optional live 2020/2040 outlook when the panel has fetched it).
 */
export function buildCityClimateBrief(
  city: City,
  liveClimate?: CityClimateData | null,
): CityClimateBrief | null {
  const profile = getClimateProfile(city.id);
  if (!profile) return null;

  return {
    overview: buildOverview(city, profile),
    weather: buildWeather(profile),
    risksNarrative: buildRisksNarrative(profile),
    outlook: buildOutlook(liveClimate),
    facts: profile.facts.map((id) => ({ id, label: labelFor(id), kind: "fact" as const })),
    risks: profile.risks.map((id) => ({
      id,
      label: labelFor(id),
      kind: "risk" as const,
    })),
    hazards: profile.hazards.map((id) => ({
      id,
      label: labelFor(id),
      kind: "hazard" as const,
    })),
  };
}

export function riskDetail(risk: ClimateRisk, profile: ClimateProfile): string {
  return RISK_DETAIL[risk](profile.features);
}

export function hazardDetail(hazard: ClimateHazard): string {
  return HAZARD_DETAIL[hazard];
}

export function getCityRiskDetails(cityId: string): Array<{ id: ClimateRisk; label: string; detail: string }> {
  const profile = getClimateProfile(cityId);
  if (!profile) return [];
  return profile.risks.map((id) => ({
    id,
    label: labelFor(id),
    detail: riskDetail(id, profile),
  }));
}

export function getCityHazardDetails(
  cityId: string,
): Array<{ id: ClimateHazard; label: string; detail: string }> {
  const profile = getClimateProfile(cityId);
  if (!profile) return [];
  return profile.hazards.map((id) => ({
    id,
    label: labelFor(id),
    detail: hazardDetail(id),
  }));
}
