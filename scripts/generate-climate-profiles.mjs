/**
 * Fetches Open-Meteo CMIP6 climate data for every city and writes
 * `src/data/climate-profiles.json` used by the similarity algorithm.
 *
 * Usage: npm run generate:climate-profiles
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const citiesPath = path.join(root, "src/data/cities.ts");
const hazardsPath = path.join(root, "src/data/city-hazards.ts");
const outPath = path.join(root, "src/data/climate-profiles.json");

const SOURCE_YEAR = 2020;
const MODEL = "EC_Earth3P_HR";
const BATCH_SIZE = 4;
const BATCH_PAUSE_MS = 1200;
const MAX_ATTEMPTS = 8;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function loadCities() {
  const text = fs.readFileSync(citiesPath, "utf8");
  const start = text.indexOf("export const CITIES");
  const arrStart = text.indexOf("[", start);
  const cities = Function(`return ${text.slice(arrStart).replace(/;?\s*$/, "")}`)();
  return cities;
}

function loadCityHazards() {
  const text = fs.readFileSync(hazardsPath, "utf8");
  const start = text.indexOf("export const CITY_HAZARDS");
  const objStart = text.indexOf("{", start);
  const endMarker = text.indexOf("export function hazardsForCity", objStart);
  const objectText = text.slice(objStart, endMarker).replace(/;?\s*$/, "");
  return Function(`return (${objectText})`)();
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function aggregateMonthly(daily) {
  const buckets = Array.from({ length: 12 }, () => ({
    mean: [],
    max: [],
    min: [],
    precip: [],
  }));

  daily.time.forEach((iso, index) => {
    const month = Number(iso.slice(5, 7)) - 1;
    if (month < 0 || month > 11) return;
    const meanTemp = daily.temperature_2m_mean[index];
    const maxTemp = daily.temperature_2m_max[index];
    const minTemp = daily.temperature_2m_min[index];
    const precip = daily.precipitation_sum[index];
    if (Number.isFinite(meanTemp)) buckets[month].mean.push(meanTemp);
    if (Number.isFinite(maxTemp)) buckets[month].max.push(maxTemp);
    if (Number.isFinite(minTemp)) buckets[month].min.push(minTemp);
    if (Number.isFinite(precip)) buckets[month].precip.push(precip);
  });

  return buckets.map((bucket, month) => ({
    month: month + 1,
    label: MONTH_LABELS[month],
    meanTemp: mean(bucket.mean),
    maxTemp: mean(bucket.max),
    minTemp: mean(bucket.min),
    precipMm: bucket.precip.reduce((sum, value) => sum + value, 0),
  }));
}

function deriveFeatures(months) {
  const meanTemps = months.map((month) => month.meanTemp);
  const precips = months.map((month) => month.precipMm);
  const annualMeanTemp = mean(meanTemps);
  const annualPrecipMm = precips.reduce((sum, value) => sum + value, 0);
  const hottestMonthMean = Math.max(...meanTemps);
  const coldestMonthMean = Math.min(...meanTemps);
  const tempSeasonality = hottestMonthMean - coldestMonthMean;
  const wettestMonthMm = Math.max(...precips);
  const driestMonthMm = Math.min(...precips);
  const precipSeasonality = (wettestMonthMm - driestMonthMm) / Math.max(annualPrecipMm, 1);
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

function deriveFacts(features) {
  const facts = [];
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

  if (hottestMonthMean >= 35) facts.push("warming_hotspot");
  return facts;
}

const FEATURE_KEYS = [
  "annualMeanTemp",
  "annualPrecipMm",
  "hottestMonthMean",
  "coldestMonthMean",
  "tempSeasonality",
  "wettestMonthMm",
  "driestMonthMm",
  "precipSeasonality",
  "precipConcentration",
];

const FEATURE_SCALE = {
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

function featuresToVector(features) {
  const raw = FEATURE_KEYS.map((key) => {
    const { center, spread } = FEATURE_SCALE[key];
    return Math.tanh((features[key] - center) / spread);
  });
  const magnitude = Math.sqrt(raw.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return raw;
  return raw.map((value) => value / magnitude);
}

function buildProfile(cityId, months, cityHazards) {
  const features = deriveFeatures(months);
  return {
    cityId,
    sourceYear: SOURCE_YEAR,
    model: MODEL,
    features,
    months,
    risks: deriveRisks(features),
    facts: deriveFacts(features),
    hazards: cityHazards[cityId] ?? [],
    vector: featuresToVector(features),
  };
}

async function fetchBatch(cities) {
  const latitudes = cities.map((city) => city.lat).join(",");
  const longitudes = cities.map((city) => city.lon).join(",");
  const url =
    `https://climate-api.open-meteo.com/v1/climate` +
    `?latitude=${latitudes}&longitude=${longitudes}` +
    `&start_date=${SOURCE_YEAR}-01-01&end_date=${SOURCE_YEAR}-12-31` +
    `&models=${MODEL}` +
    `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo ${response.status} for batch of ${cities.length}`);
  }
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : [payload];
  if (rows.length !== cities.length) {
    throw new Error(`Expected ${cities.length} results, got ${rows.length}`);
  }
  return rows;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExistingProfiles() {
  if (!fs.existsSync(outPath)) return {};
  try {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    return existing.profiles && typeof existing.profiles === "object" ? existing.profiles : {};
  } catch {
    return {};
  }
}

function writeCheckpoint(profiles) {
  const output = {
    generatedAt: new Date().toISOString(),
    sourceYear: SOURCE_YEAR,
    model: MODEL,
    cityCount: Object.keys(profiles).length,
    profiles,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);
}

async function main() {
  const cities = loadCities();
  const cityHazards = loadCityHazards();
  /** @type {Record<string, unknown>} */
  const profiles = loadExistingProfiles();
  const pending = cities.filter((city) => !profiles[city.id]);

  console.log(
    `Generating climate profiles for ${cities.length} cities (${pending.length} remaining)…`,
  );

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    let attempt = 0;
    while (true) {
      attempt += 1;
      try {
        const rows = await fetchBatch(batch);
        rows.forEach((row, index) => {
          const city = batch[index];
          const months = aggregateMonthly(row.daily);
          profiles[city.id] = buildProfile(city.id, months, cityHazards);
        });
        writeCheckpoint(profiles);
        console.log(`  ${Object.keys(profiles).length}/${cities.length}`);
        break;
      } catch (error) {
        if (attempt >= MAX_ATTEMPTS) throw error;
        const wait = Math.min(30000, 2000 * 2 ** (attempt - 1));
        console.warn(`  retry batch @${i} in ${wait}ms:`, error.message);
        await sleep(wait);
      }
    }
    await sleep(BATCH_PAUSE_MS);
  }

  writeCheckpoint(profiles);
  console.log(`Wrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
