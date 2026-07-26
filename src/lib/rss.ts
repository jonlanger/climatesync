/** Minimal RSS 2.0 item extractor (no external dependency). */

export type RssItem = {
  title: string;
  link: string;
  pubDate: string | null;
  source: string | null;
  description: string | null;
  lat: number | null;
  lon: number | null;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripTags(value: string): string {
  return decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function tagValue(block: string, tag: string): string | null {
  const cdata = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"));
  if (cdata?.[1]) return decodeXml(cdata[1]);
  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (plain?.[1]) return decodeXml(plain[1]);
  return null;
}

function parseGeo(block: string): { lat: number | null; lon: number | null } {
  const point = block.match(/<georss:point>([^<]+)<\/georss:point>/i);
  if (point?.[1]) {
    const [latRaw, lonRaw] = point[1].trim().split(/\s+/);
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  const latTag = tagValue(block, "geo:lat");
  const lonTag = tagValue(block, "geo:long") ?? tagValue(block, "geo:lon");
  const lat = latTag != null ? Number(latTag) : NaN;
  const lon = lonTag != null ? Number(lonTag) : NaN;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
  };
}

export function parseRssItems(xml: string, limit = 12): RssItem[] {
  const items: RssItem[] = [];
  const matches = xml.matchAll(/<item\b[\s\S]*?<\/item>/gi);
  for (const match of matches) {
    const block = match[0];
    const title = tagValue(block, "title");
    const link = tagValue(block, "link");
    if (!title || !link) continue;
    const source =
      tagValue(block, "source") ??
      tagValue(block, "dc:creator") ??
      null;
    const { lat, lon } = parseGeo(block);
    items.push({
      title: stripTags(title),
      link: link.trim(),
      pubDate: tagValue(block, "pubDate"),
      source: source ? stripTags(source) : null,
      description: (() => {
        const raw = tagValue(block, "description");
        return raw ? stripTags(raw).slice(0, 240) : null;
      })(),
      lat,
      lon,
    });
    if (items.length >= limit) break;
  }
  return items;
}

/** Great-circle distance in km. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
