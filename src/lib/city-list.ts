import type { City } from "@/data/cities";

export type CitySortKey =
  | "population-desc"
  | "population-asc"
  | "name-asc"
  | "name-desc"
  | "country-asc";

export const CITY_SORT_OPTIONS: Array<{ value: CitySortKey; label: string }> = [
  { value: "population-desc", label: "Population ↓" },
  { value: "population-asc", label: "Population ↑" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "country-asc", label: "Country A–Z" },
];

export function filterCities(cities: readonly City[], filter: string): City[] {
  const q = filter.trim().toLowerCase();
  if (!q) return [...cities];
  return cities.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      city.country.toLowerCase().includes(q) ||
      city.id.includes(q),
  );
}

export function sortCities(cities: readonly City[], sort: CitySortKey): City[] {
  const sorted = [...cities];
  switch (sort) {
    case "population-desc":
      sorted.sort((a, b) => b.population - a.population || a.rank - b.rank);
      break;
    case "population-asc":
      sorted.sort((a, b) => a.population - b.population || a.rank - b.rank);
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name) || a.rank - b.rank);
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name) || a.rank - b.rank);
      break;
    case "country-asc":
      sorted.sort(
        (a, b) =>
          a.country.localeCompare(b.country) ||
          a.name.localeCompare(b.name) ||
          a.rank - b.rank,
      );
      break;
  }
  return sorted;
}

/**
 * Rank used for globe marker size: 1 = largest dot, N = smallest.
 * Derived from the active sort order across the full city set.
 */
export function buildSizeRanks(sortedCities: readonly City[]): Map<string, number> {
  const ranks = new Map<string, number>();
  sortedCities.forEach((city, index) => {
    ranks.set(city.id, index + 1);
  });
  return ranks;
}

/** Population-style tiers from a size rank (1 = top). */
export function markerTier(sizeRank: number): "major" | "secondary" | "tertiary" {
  if (sizeRank <= 100) return "major";
  if (sizeRank <= 250) return "secondary";
  return "tertiary";
}
