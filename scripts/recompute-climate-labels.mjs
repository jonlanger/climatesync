/**
 * Re-derives risks + attaches static hazards on existing climate-profiles.json
 * without re-fetching Open-Meteo data.
 *
 * Usage: node scripts/recompute-climate-labels.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const hazardsPath = path.join(root, "src/data/city-hazards.ts");
const profilesPath = path.join(root, "src/data/climate-profiles.json");

function loadCityHazards() {
  const text = fs.readFileSync(hazardsPath, "utf8");
  const start = text.indexOf("export const CITY_HAZARDS");
  const objStart = text.indexOf("{", start);
  // Truncate at the matching closing of CITY_HAZARDS (before hazardsForCity).
  const endMarker = text.indexOf("export function hazardsForCity", objStart);
  const objectText = text.slice(objStart, endMarker).replace(/;?\s*$/, "");
  return Function(`return (${objectText})`)();
}

function deriveRisks(features) {
  const risks = [];
  if (features.hottestMonthMean >= 32 || features.annualMeanTemp >= 28) risks.push("extreme_heat");
  if (features.coldestMonthMean <= -5 || features.annualMeanTemp <= 0) risks.push("extreme_cold");
  if (features.wettestMonthMm >= 250 || features.annualPrecipMm >= 1800) risks.push("heavy_rainfall");
  if (features.annualPrecipMm <= 400 || features.driestMonthMm <= 5) risks.push("drought_stress");
  if (features.tempSeasonality >= 25) risks.push("high_seasonality");
  if (features.precipConcentration >= 0.55 && features.annualPrecipMm >= 600) {
    risks.push("monsoon_pattern");
  }
  if (
    features.hottestMonthMean >= 30 &&
    features.annualPrecipMm <= 700 &&
    features.driestMonthMm <= 20
  ) {
    risks.push("wildfire_risk");
  }
  if (features.wettestMonthMm >= 200 && features.precipConcentration >= 0.48) {
    risks.push("storm_risk");
  }
  if (
    features.wettestMonthMm >= 250 ||
    (features.annualPrecipMm >= 1400 && features.precipConcentration >= 0.45)
  ) {
    risks.push("landslide_risk");
  }
  return risks;
}

function main() {
  const cityHazards = loadCityHazards();
  const file = JSON.parse(fs.readFileSync(profilesPath, "utf8"));
  const riskCounts = {};
  const hazardCounts = {};

  for (const [cityId, profile] of Object.entries(file.profiles)) {
    profile.risks = deriveRisks(profile.features);
    profile.hazards = cityHazards[cityId] ?? [];
    for (const risk of profile.risks) riskCounts[risk] = (riskCounts[risk] ?? 0) + 1;
    for (const hazard of profile.hazards) hazardCounts[hazard] = (hazardCounts[hazard] ?? 0) + 1;
  }

  file.generatedAt = new Date().toISOString();
  fs.writeFileSync(profilesPath, `${JSON.stringify(file, null, 2)}\n`);

  console.log(`Updated ${file.cityCount} profiles`);
  console.log("Risk counts:", riskCounts);
  console.log("Hazard counts:", hazardCounts);
}

main();
