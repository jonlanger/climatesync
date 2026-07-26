import { NextRequest } from "next/server";

import type { CityAlertItem, CityContextData, CityImage, CityNewsItem } from "@/lib/city-context";
import { haversineKm, parseRssItems } from "@/lib/rss";

export const dynamic = "force-dynamic";

const UA = "ClimateSync/1.0 (educational climate explorer; local-dev)";

type WikiSummary = {
  type?: string;
  title?: string;
  extract?: string;
  description?: string;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source: string; width?: number; height?: number };
  originalimage?: { source: string; width?: number; height?: number };
};

async function fetchText(url: string, init?: RequestInit): Promise<string | null> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml, application/xml, text/xml, application/json, */*",
        ...(init?.headers ?? {}),
      },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const text = await fetchText(url, {
    headers: { Accept: "application/json" },
  });
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function wikiTitleCandidates(name: string, country: string): string[] {
  const cleaned = name.replace(/\s+/g, " ").trim();
  const candidates = [
    cleaned,
    `${cleaned}, ${country}`,
    `${cleaned} (${country})`,
    cleaned.replace(/^New /, ""),
  ];
  // Deduplicate while preserving order.
  return [...new Set(candidates.filter(Boolean))];
}

async function resolveWikipedia(
  name: string,
  country: string,
): Promise<{ image: CityImage | null; extract: string | null; wikiUrl: string | null }> {
  for (const title of wikiTitleCandidates(name, country)) {
    const encoded = encodeURIComponent(title.replace(/ /g, "_"));
    const summary = await fetchJson<WikiSummary>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
    );
    if (!summary || summary.type === "disambiguation") continue;

    const thumb = summary.originalimage ?? summary.thumbnail;
    const pageUrl = summary.content_urls?.desktop?.page ?? null;
    const image: CityImage | null = thumb
      ? {
          src: thumb.source,
          alt: `${summary.title ?? name} — Wikimedia Commons`,
          credit: "Wikipedia / Wikimedia Commons",
          creditHref: pageUrl ?? "https://commons.wikimedia.org/",
          width: thumb.width ?? null,
          height: thumb.height ?? null,
        }
      : null;

    if (image || summary.extract) {
      return {
        image,
        extract: summary.extract?.trim() || summary.description || null,
        wikiUrl: pageUrl,
      };
    }
  }
  return { image: null, extract: null, wikiUrl: null };
}

async function fetchGoogleNews(name: string, country: string): Promise<CityNewsItem[]> {
  const query = `${name} ${country} (climate OR weather OR flood OR drought OR heatwave OR storm OR cyclone OR wildfire)`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url);
  if (!xml) return [];
  return parseRssItems(xml, 8).map((item) => ({
    title: item.title,
    url: item.link,
    source: item.source,
    publishedAt: item.pubDate,
  }));
}

async function fetchGdacsAlerts(lat: number, lon: number): Promise<CityAlertItem[]> {
  const xml = await fetchText("https://www.gdacs.org/xml/rss.xml");
  if (!xml) return [];

  const nearby: CityAlertItem[] = [];
  for (const item of parseRssItems(xml, 80)) {
    if (item.lat == null || item.lon == null) continue;
    const distanceKm = haversineKm(lat, lon, item.lat, item.lon);
    if (distanceKm > 750) continue;

    const levelMatch = item.title.match(/\b(Red|Orange|Green|Yellow)\b/i);
    nearby.push({
      title: item.title,
      url: item.link,
      description: item.description,
      alertLevel: levelMatch?.[1] ?? null,
      distanceKm: Math.round(distanceKm),
      publishedAt: item.pubDate,
    });
  }

  return nearby.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cityId = searchParams.get("cityId")?.trim();
  const name = searchParams.get("name")?.trim();
  const country = searchParams.get("country")?.trim() ?? "";
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!cityId || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json(
      { error: "cityId, name, lat, and lon are required" },
      { status: 400 },
    );
  }

  const [wiki, news, alerts] = await Promise.all([
    resolveWikipedia(name, country),
    fetchGoogleNews(name, country),
    fetchGdacsAlerts(lat, lon),
  ]);

  const payload: CityContextData = {
    cityId,
    image: wiki.image,
    extract: wiki.extract,
    wikiUrl: wiki.wikiUrl,
    news,
    alerts,
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
