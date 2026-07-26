export type CityNewsItem = {
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
};

export type CityAlertItem = {
  title: string;
  url: string;
  description: string | null;
  alertLevel: string | null;
  distanceKm: number;
  publishedAt: string | null;
};

export type CityImage = {
  src: string;
  alt: string;
  credit: string;
  creditHref: string;
  width: number | null;
  height: number | null;
};

export type CityContextData = {
  cityId: string;
  image: CityImage | null;
  extract: string | null;
  wikiUrl: string | null;
  news: CityNewsItem[];
  alerts: CityAlertItem[];
};

export async function fetchCityContext(input: {
  cityId: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}): Promise<CityContextData> {
  const params = new URLSearchParams({
    cityId: input.cityId,
    name: input.name,
    country: input.country,
    lat: String(input.lat),
    lon: String(input.lon),
  });
  const response = await fetch(`/api/city-context?${params.toString()}`);
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `City context failed (${response.status})`);
  }
  return (await response.json()) as CityContextData;
}
