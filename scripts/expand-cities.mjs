/**
 * Appends the next 200 GeoNames cities (by population) after the existing list.
 * Preserves existing city ids/ranks 1–N; new cities get ranks N+1…N+200.
 *
 * Usage: node scripts/expand-cities.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const citiesPath = path.join(root, "src/data/cities.ts");
const geonamesPath = "/tmp/geonames-cities/cities15000.txt";
const countryInfoPath = "/tmp/geonames-cities/countryInfo.txt";
const ADD_COUNT = 200;
const NEAR_KM = 25;

function loadExistingCities() {
  const text = fs.readFileSync(citiesPath, "utf8");
  const start = text.indexOf("export const CITIES");
  const arrStart = text.indexOf("[", start);
  return Function(`return ${text.slice(arrStart).replace(/;?\s*$/, "")}`)();
}

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function loadCountries() {
  const map = new Map();
  for (const line of fs.readFileSync(countryInfoPath, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    map.set(cols[0], cols[4]);
  }
  return map;
}

function loadGeonames(countries) {
  const rows = [];
  for (const line of fs.readFileSync(geonamesPath, "utf8").split("\n")) {
    if (!line) continue;
    const cols = line.split("\t");
    const name = cols[2] || cols[1];
    const lat = Number(cols[4]);
    const lon = Number(cols[5]);
    const featureClass = cols[6];
    const countryCode = cols[8];
    const population = Number(cols[14]);
    if (featureClass !== "P" || !Number.isFinite(population) || population <= 0) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const country = countries.get(countryCode);
    if (!country) continue;
    rows.push({ name, lat, lon, population, country, countryCode });
  }
  rows.sort((a, b) => b.population - a.population);
  return rows;
}

function isDuplicate(candidate, existing, usedIds) {
  const slug = slugify(candidate.name);
  if (usedIds.has(slug)) return true;
  // Country-qualified slug collisions handled later.
  for (const city of existing) {
    if (haversineKm(candidate.lat, candidate.lon, city.lat, city.lon) < NEAR_KM) {
      return true;
    }
    if (
      slugify(city.name) === slug &&
      city.country.toLowerCase() === candidate.country.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

function uniqueId(name, country, usedIds) {
  const base = slugify(name) || "city";
  if (!usedIds.has(base)) return base;
  const withCountry = `${base}-${slugify(country).slice(0, 12)}`;
  if (!usedIds.has(withCountry)) return withCountry;
  let i = 2;
  while (usedIds.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

function formatCity(city) {
  return `  {
    id: ${JSON.stringify(city.id)},
    name: ${JSON.stringify(city.name)},
    country: ${JSON.stringify(city.country)},
    lat: ${city.lat},
    lon: ${city.lon},
    population: ${city.population},
    rank: ${city.rank},
  }`;
}

function main() {
  const existing = loadExistingCities();
  const countries = loadCountries();
  const geonames = loadGeonames(countries);
  const usedIds = new Set(existing.map((city) => city.id));

  const added = [];
  for (const row of geonames) {
    if (added.length >= ADD_COUNT) break;
    if (isDuplicate(row, existing.concat(added), usedIds)) continue;
    const id = uniqueId(row.name, row.country, usedIds);
    usedIds.add(id);
    added.push({
      id,
      name: row.name,
      country: row.country,
      lat: Math.round(row.lat * 10000) / 10000,
      lon: Math.round(row.lon * 10000) / 10000,
      population: row.population,
      rank: existing.length + added.length + 1,
    });
  }

  if (added.length < ADD_COUNT) {
    throw new Error(`Only found ${added.length} new cities (wanted ${ADD_COUNT})`);
  }

  const all = [...existing, ...added];
  const total = all.length;
  const header = `export type City = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  population: number;
  rank: number;
};

/** Top ${total} cities by GeoNames population. Ranks 1–100 major, 101–250 secondary, 251–${total} tertiary markers. */
export const CITIES: City[] = [
`;

  const body = all.map(formatCity).join(",\n");
  const out = `${header}${body},\n];\n`;
  fs.writeFileSync(citiesPath, out);

  console.log(`Wrote ${total} cities (${existing.length} kept, ${added.length} added)`);
  console.log("First added:", added[0]);
  console.log("Last added:", added[added.length - 1]);
}

main();
