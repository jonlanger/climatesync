export type ClimateTerm = {
  id: string;
  term: string;
  aliases: string[];
  summary: string;
  detail: string;
};

export const CLIMATE_TERMS: ClimateTerm[] = [
  {
    id: "heat-risk",
    term: "Heat risk",
    aliases: ["heat", "heatwave", "extreme heat", "heat stress"],
    summary: "Exposure to dangerously high temperatures and prolonged heatwaves.",
    detail:
      "Heat risk rises with hotter summers, more days above ~32°C, and urban heat-island effects. Similar cities often share high summer temperatures and strong warming outlooks toward 2040.",
  },
  {
    id: "drought-risk",
    term: "Drought risk",
    aliases: ["drought", "arid", "water stress", "dry"],
    summary: "Tendency toward low rainfall combined with high evaporative demand.",
    detail:
      "Drought-prone climates combine limited annual precipitation with warm seasons. Comparing cities on drought risk highlights places facing similar water-stress pressures.",
  },
  {
    id: "flood-risk",
    term: "Flood risk",
    aliases: ["flood", "flooding", "deluge", "extreme rain"],
    summary: "Potential for heavy rainfall totals and intense wet-season peaks.",
    detail:
      "Flood-related climate similarity looks at annual rainfall and how peaked the wet season is. Monsoon and tropical wet climates often cluster together.",
  },
  {
    id: "seasonality",
    term: "Seasonality",
    aliases: ["seasonal", "seasons", "temperature range"],
    summary: "How much temperature swings between the warmest and coldest months.",
    detail:
      "High seasonality means continental or higher-latitude climates; low seasonality is common in tropical and maritime settings.",
  },
  {
    id: "warming",
    term: "Warming outlook",
    aliases: ["warming", "climate change", "temperature rise", "2040"],
    summary: "Projected mean-temperature increase from 2020 to 2040 in CMIP6 models.",
    detail:
      "Open-Meteo’s climate API provides downscaled CMIP6 projections. Cities with similar warming deltas may face comparable adaptation timelines.",
  },
  {
    id: "precipitation",
    term: "Precipitation",
    aliases: ["rain", "rainfall", "precip", "wet", "rainfall total"],
    summary: "Total water falling as rain, showers, or snow over a year.",
    detail:
      "Annual precipitation is a core climate fingerprint. Wet cities can still differ by whether rain is year-round or concentrated in a monsoon season.",
  },
  {
    id: "cmip6",
    term: "CMIP6",
    aliases: ["cmip", "climate model", "ec-earth"],
    summary: "The Coupled Model Intercomparison Project Phase 6 climate-model ensemble.",
    detail:
      "Climate Sync uses Open-Meteo’s EC-Earth3P-HR CMIP6 fields (bias-corrected) to compare recent (2020) and near-future (2040) conditions.",
  },
  {
    id: "climate-analogue",
    term: "Climate analogue",
    aliases: ["analogue", "analog", "similar climate", "climate twin"],
    summary: "A place whose climate statistics closely match another location.",
    detail:
      "Our similarity score compares temperature, rainfall, seasonality, and risk indices. High scores mean the cities are climate analogues—useful for shared adaptation lessons.",
  },
];

export function findClimateTerm(query: string): ClimateTerm | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  return (
    CLIMATE_TERMS.find((term) => {
      if (term.term.toLowerCase() === q || term.id === q) return true;
      return term.aliases.some((alias) => q === alias || q.includes(alias));
    }) ?? null
  );
}
