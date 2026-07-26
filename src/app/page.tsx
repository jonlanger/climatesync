import { EarthExplorer } from "@/components/earth/EarthExplorer";

type PageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = params.q;
  const initialQuery = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";

  return <EarthExplorer key={initialQuery || "home"} initialQuery={initialQuery} />;
}
